import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, 'ar-group-of-eductions/.env.cockroachdb') });
dotenv.config({ path: path.join(root, 'apps/frontend/.env.local'), override: false });

const url = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
if (!url || !/cockroach|26257/i.test(url)) {
  console.error('No Cockroach URL in .env.cockroachdb / .env.local');
  process.exit(1);
}

const cutoff = process.env.CUTOFF || '2026-08-15T00:00:00.000Z';
const outDir = path.join(root, 'backups/pre-strapi-migration-2026-09-18/strapi-seed');
fs.mkdirSync(outDir, { recursive: true });

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log('[cockroach] connected, cutoff=', cutoff);

const tables = await client.query(`
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_type='BASE TABLE'
    AND table_name ILIKE '%blog%'
  ORDER BY 1,2
`);
console.log('[cockroach] blog-ish tables', tables.rows);

let rows = [];
const candidates = [
  `"BlogPost"`,
  `blog_posts`,
  `posts`,
  `"posts"`,
];

for (const t of candidates) {
  try {
    const q = `
      SELECT * FROM ${t}
      WHERE COALESCE("publishedAt", published_at, "updatedAt", updated_at) >= $1::timestamptz
      ORDER BY COALESCE("publishedAt", published_at) DESC NULLS LAST
    `;
    const res = await client.query(q, [cutoff]);
    rows = res.rows;
    console.log('[cockroach] hit', t, 'rows', rows.length);
    break;
  } catch (e) {
    console.log('[cockroach] skip', t, e.message.slice(0, 120));
  }
}

if (!rows.length) {
  // fallback: dump column names from first existing table
  try {
    const sample = await client.query(`SELECT * FROM "BlogPost" LIMIT 1`);
    console.log('[cockroach] BlogPost cols', Object.keys(sample.rows[0] || {}));
    const all = await client.query(`SELECT COUNT(*)::int AS n FROM "BlogPost"`);
    console.log('[cockroach] BlogPost total', all.rows[0]?.n);
    const recent = await client.query(`
      SELECT id, slug, title, "publishedAt", published
      FROM "BlogPost"
      ORDER BY "publishedAt" DESC NULLS LAST
      LIMIT 20
    `);
    console.log('[cockroach] newest 20:');
    for (const r of recent.rows) {
      console.log(r.publishedAt, r.published, r.slug);
    }
  } catch (e) {
    console.error('[cockroach] BlogPost probe failed', e.message);
  }
  await client.end();
  process.exit(1);
}

function mapRow(r) {
  return {
    title: r.title,
    slug: r.slug,
    content: r.content || '',
    excerpt: r.excerpt || '',
    featuredImage: r.featuredImage || r.featured_image || null,
    category: r.category || 'Blog',
    tags: r.tags || [],
    metaTitle: r.metaTitle || r.meta_title || null,
    metaDescription: r.metaDescription || r.meta_description || null,
    canonicalUrl: r.canonicalUrl || r.canonical_url || null,
    focusKeyword: r.focusKeyword || r.focus_keyword || null,
    keywords: r.keywords || [],
    ogTitle: r.ogTitle || null,
    ogDescription: r.ogDescription || null,
    ogImage: r.ogImage || null,
    twitterTitle: r.twitterTitle || null,
    twitterDescription: r.twitterDescription || null,
    schemaJson: r.schemaJson || r.schema_json || null,
    author: r.author || 'AR Group',
    wpId: r.wpId || r.wp_id || null,
    mysqlId: r.id || null,
    views: r.views || 0,
    published: r.published !== false,
    publishedAt: r.publishedAt || r.published_at || null,
  };
}

const mapped = rows.map(mapRow);
const outFile = path.join(outDir, 'posts-after-2026-08-15.json');
fs.writeFileSync(outFile, JSON.stringify(mapped, null, 2));
console.log('[cockroach] wrote', outFile, 'count', mapped.length);
await client.end();
