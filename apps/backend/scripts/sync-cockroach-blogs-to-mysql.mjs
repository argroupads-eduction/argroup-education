/**
 * Export BlogPost (+ optional cms.posts metadata) from Cockroach SOURCE_DATABASE_URL
 * into Hostinger MySQL.
 *
 *   node apps/backend/scripts/sync-cockroach-blogs-to-mysql.mjs
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const sourceUrl = process.env.SOURCE_DATABASE_URL?.trim();
if (!sourceUrl) {
  console.error('SOURCE_DATABASE_URL missing');
  process.exit(1);
}

function asJsonArray(value) {
  if (Array.isArray(value)) return value;
  return [];
}

const source = new pg.Client({
  connectionString: sourceUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 25000,
});

const mysql = new PrismaClient();

try {
  await source.connect();
  console.log('[cockroach] connected');

  // Discover tables
  const tables = await source.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND (
        table_name ILIKE '%blog%'
        OR table_name ILIKE '%post%'
      )
    ORDER BY table_schema, table_name
  `);
  console.log('[cockroach] tables', tables.rows);

  let rows = [];
  // Prefer public."BlogPost" marketing table
  try {
    const r = await source.query(`
      SELECT
        id, "wpId", title, slug, content, excerpt, "featuredImage", category,
        tags, "metaTitle", "metaDescription", "canonicalUrl", "focusKeyword",
        keywords, "ogTitle", "ogDescription", "ogImage", "twitterTitle",
        "twitterDescription", "schemaJson", author, published, "publishedAt",
        views, "createdAt", "updatedAt"
      FROM "BlogPost"
      WHERE COALESCE(published, true) = true
      ORDER BY "publishedAt" DESC NULLS LAST
    `);
    rows = r.rows;
    console.log(`[cockroach] BlogPost rows=${rows.length}`);
  } catch (e) {
    console.log('[cockroach] BlogPost query failed:', e.message);
  }

  // Also list cms.posts if present (Payload)
  try {
    const cms = await source.query(`
      SELECT id, slug, title, _status, published_at, updated_at, created_at
      FROM cms.posts
      ORDER BY COALESCE(published_at, updated_at) DESC NULLS LAST
      LIMIT 30
    `);
    const sep = await source.query(`
      SELECT COUNT(*)::int AS c FROM cms.posts
      WHERE published_at >= '2026-09-01' OR updated_at >= '2026-09-01' OR created_at >= '2026-09-01'
    `);
    const byMonth = await source.query(`
      SELECT to_char(published_at, 'YYYY-MM') AS m, COUNT(*)::int AS c
      FROM cms.posts
      WHERE _status = 'published' AND published_at IS NOT NULL
      GROUP BY 1 ORDER BY 1 DESC LIMIT 12
    `);
    console.log(
      JSON.stringify(
        {
          cmsNewest: cms.rows,
          cmsSepRelated: sep.rows[0],
          cmsByMonth: byMonth.rows,
        },
        null,
        2
      )
    );
  } catch (e) {
    console.log('[cockroach] cms.posts probe failed:', e.message);
  }

  if (rows.length) {
    const byMonth = {};
    let fromSep = 0;
    let fromMarch = 0;
    for (const row of rows) {
      const d = row.publishedAt ? new Date(row.publishedAt) : null;
      if (d) {
        const key = d.toISOString().slice(0, 7);
        byMonth[key] = (byMonth[key] || 0) + 1;
        if (d >= new Date('2026-09-01')) fromSep++;
        if (d >= new Date('2026-03-01')) fromMarch++;
      }
    }
    console.log(JSON.stringify({ blogPostByMonth: byMonth, fromSep, fromMarch }, null, 2));
  }

  let upserted = 0;
  for (const row of rows) {
    if (!row.slug) continue;
    const data = {
      title: row.title || row.slug,
      slug: String(row.slug).trim(),
      content: row.content || '',
      excerpt: row.excerpt || '',
      featuredImage: row.featuredImage || null,
      category: row.category || 'Blog',
      tags: asJsonArray(row.tags),
      metaTitle: row.metaTitle || null,
      metaDescription: row.metaDescription || null,
      canonicalUrl: row.canonicalUrl || null,
      focusKeyword: row.focusKeyword || null,
      keywords: asJsonArray(row.keywords),
      ogTitle: row.ogTitle || null,
      ogDescription: row.ogDescription || null,
      ogImage: row.ogImage || row.featuredImage || null,
      twitterTitle: row.twitterTitle || null,
      twitterDescription: row.twitterDescription || null,
      schemaJson: row.schemaJson ?? undefined,
      author: row.author || 'AR Group',
      published: row.published !== false,
      publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
      views: row.views || 0,
      ...(row.wpId != null ? { wpId: row.wpId } : {}),
    };

    const existing = await mysql.blogPost.findUnique({ where: { slug: data.slug } });
    if (existing) {
      await mysql.blogPost.update({
        where: { slug: data.slug },
        data: {
          ...data,
          featuredImage: data.featuredImage || existing.featuredImage,
          ogImage: data.ogImage || existing.ogImage,
          metaTitle: data.metaTitle || existing.metaTitle,
          metaDescription: data.metaDescription || existing.metaDescription,
        },
      });
    } else {
      await mysql.blogPost.create({
        data: { id: row.id || undefined, ...data },
      });
    }
    upserted++;
    if (upserted % 25 === 0) console.log(`[mysql] upserted ${upserted}/${rows.length}`);
  }

  const mysqlTotal = await mysql.blogPost.count({ where: { published: true } });
  const mysqlSep = await mysql.blogPost.count({
    where: { published: true, publishedAt: { gte: new Date('2026-09-01') } },
  });
  const newest = await mysql.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take: 10,
    select: { slug: true, publishedAt: true, featuredImage: true, metaTitle: true },
  });

  console.log(
    JSON.stringify(
      {
        cockroachBlogPosts: rows.length,
        upserted,
        mysqlTotal,
        mysqlSep,
        newest,
      },
      null,
      2
    )
  );
} catch (e) {
  console.error('[fail]', e.message || e);
  process.exitCode = 1;
} finally {
  await source.end().catch(() => undefined);
  await mysql.$disconnect().catch(() => undefined);
}
