/**
 * Apply DB deletes for DELETE_BLOG_SLUGS (Payload cms.posts + BlogPost unpublish).
 * Usage: node --env-file=apps/frontend/.env.local scripts/apply-delete-listed-blogs-db.mjs
 */
import pg from 'pg';
import { DELETE_BLOG_SLUGS } from './delete-blog-slugs-list.mjs';

const slugs = [...new Set(DELETE_BLOG_SLUGS.map((s) => s.trim()).filter(Boolean))];
const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url.replace(/[?&]sslmode=[^&]*/g, ''),
  ssl: { rejectUnauthorized: false },
});

await client.connect();

async function tryQuery(label, text, params) {
  try {
    const r = await client.query(text, params);
    console.log(label, r.rowCount);
    return r;
  } catch (e) {
    console.warn(label, 'SKIP:', e.message.split('\n')[0]);
    return null;
  }
}

try {
  const idsRes = await client.query(
    'SELECT id, slug FROM cms.posts WHERE slug = ANY($1::text[])',
    [slugs]
  );
  console.log('cms matched', idsRes.rowCount);
  const idList = idsRes.rows.map((r) => r.id);

  if (idList.length) {
    // Discover version author table columns once
    const cols = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'cms'
        AND table_name IN (
          '_posts_v_version_populated_authors',
          'posts_populated_authors',
          'posts_rels',
          '_posts_v_rels'
        )
    `);
    const byTable = {};
    for (const row of cols.rows) {
      (byTable[row.table_name] ??= []).push(row.column_name);
    }

    const versionIds = await client.query(
      'SELECT id FROM cms._posts_v WHERE parent_id = ANY($1::int[])',
      [idList]
    );
    const vIds = versionIds.rows.map((r) => r.id);
    console.log('versions matched', vIds.length);

    if (vIds.length && byTable._posts_v_version_populated_authors) {
      const c = byTable._posts_v_version_populated_authors;
      const parentCol = c.includes('_parent_id')
        ? '_parent_id'
        : c.includes('parent_id')
          ? 'parent_id'
          : null;
      if (parentCol) {
        await tryQuery(
          'delete version authors',
          `DELETE FROM cms._posts_v_version_populated_authors WHERE ${parentCol} = ANY($1::int[])`,
          [vIds]
        );
      }
    }

    if (vIds.length && byTable._posts_v_rels) {
      const c = byTable._posts_v_rels;
      const parentCol = c.includes('parent_id')
        ? 'parent_id'
        : c.includes('_parent_id')
          ? '_parent_id'
          : null;
      if (parentCol) {
        await tryQuery(
          'delete version rels',
          `DELETE FROM cms._posts_v_rels WHERE ${parentCol} = ANY($1::int[])`,
          [vIds]
        );
      }
    }

    await tryQuery(
      'delete versions',
      'DELETE FROM cms._posts_v WHERE parent_id = ANY($1::int[])',
      [idList]
    );

    if (byTable.posts_populated_authors) {
      const c = byTable.posts_populated_authors;
      for (const parentCol of ['_parent_id', 'parent_id']) {
        if (c.includes(parentCol)) {
          await tryQuery(
            `delete posts authors ${parentCol}`,
            `DELETE FROM cms.posts_populated_authors WHERE ${parentCol} = ANY($1::int[])`,
            [idList]
          );
        }
      }
    }

    if (byTable.posts_rels) {
      const c = byTable.posts_rels;
      const parentCol = c.includes('parent_id')
        ? 'parent_id'
        : c.includes('_parent_id')
          ? '_parent_id'
          : null;
      if (parentCol) {
        await tryQuery(
          'delete posts rels',
          `DELETE FROM cms.posts_rels WHERE ${parentCol} = ANY($1::int[])`,
          [idList]
        );
      }
    }

    await tryQuery('delete posts', 'DELETE FROM cms.posts WHERE id = ANY($1::int[])', [idList]);
  }

  const bp = await client.query(
    `UPDATE public."BlogPost"
     SET published = false, "updatedAt" = NOW()
     WHERE slug = ANY($1::text[])`,
    [slugs]
  );
  console.log('BlogPost unpublished', bp.rowCount);

  const left = await client.query(
    'SELECT count(*)::int AS n FROM cms.posts WHERE slug = ANY($1::text[])',
    [slugs]
  );
  const stillPub = await client.query(
    `SELECT count(*)::int AS n FROM public."BlogPost"
     WHERE slug = ANY($1::text[]) AND published = true`,
    [slugs]
  );
  console.log('remaining cms', left.rows[0].n, 'still published BlogPost', stillPub.rows[0].n);
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await client.end();
}
