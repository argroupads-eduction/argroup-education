/**
 * Pull BlogPost rows from Supabase (Payload/VPS marketing DB) into Hostinger MySQL.
 *
 *   node apps/backend/scripts/sync-supabase-blogs-to-mysql.mjs
 *
 * Reads SOURCE_SUPABASE_URL from env, or falls back to apps/backend/.env.supabase.bak
 */
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

function loadSupabaseUrl() {
  if (process.env.SOURCE_SUPABASE_URL?.trim()) return process.env.SOURCE_SUPABASE_URL.trim();
  const bak = path.join(__dirname, '../.env.supabase.bak');
  if (!fs.existsSync(bak)) return null;
  const line = fs
    .readFileSync(bak, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith('DATABASE_URL_UNPOOLED=') || l.startsWith('DATABASE_URL='));
  if (!line) return null;
  return line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
}

function asJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [];
}

const sourceUrl = loadSupabaseUrl();
if (!sourceUrl) {
  console.error('No Supabase URL (SOURCE_SUPABASE_URL or .env.supabase.bak)');
  process.exit(1);
}

const source = new pg.Client({
  connectionString: sourceUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
});

const mysql = new PrismaClient();

await source.connect();
console.log('[sync] connected to Supabase');

const { rows } = await source.query(`
  SELECT
    id, "wpId", title, slug, content, excerpt, "featuredImage", category,
    tags, "metaTitle", "metaDescription", "canonicalUrl", "focusKeyword",
    keywords, "ogTitle", "ogDescription", "ogImage", "twitterTitle",
    "twitterDescription", "schemaJson", author, published, "publishedAt",
    views, "createdAt", "updatedAt"
  FROM "BlogPost"
  WHERE published = true
  ORDER BY "publishedAt" DESC NULLS LAST
`);

console.log(`[sync] fetched ${rows.length} published posts from Supabase`);

let upserted = 0;
let fromMarch = 0;
for (const row of rows) {
  const publishedAt = row.publishedAt ? new Date(row.publishedAt) : null;
  if (publishedAt && publishedAt >= new Date('2026-03-01')) fromMarch++;

  const data = {
    title: row.title || row.slug,
    slug: row.slug,
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
    publishedAt,
    views: row.views || 0,
    ...(row.wpId != null ? { wpId: row.wpId } : {}),
  };

  // Prefer keeping existing cuid if slug exists; create with supabase id when new
  const existing = await mysql.blogPost.findUnique({ where: { slug: row.slug } });
  if (existing) {
    await mysql.blogPost.update({
      where: { slug: row.slug },
      data: {
        ...data,
        // Keep bundled local featured image if already set and supabase also has image —
        // but Payload blob URLs are preferred for CMS-updated posts.
        featuredImage: data.featuredImage || existing.featuredImage,
        ogImage: data.ogImage || existing.ogImage,
      },
    });
  } else {
    await mysql.blogPost.create({
      data: {
        id: row.id,
        ...data,
      },
    });
  }
  upserted++;
  if (upserted % 20 === 0) console.log(`[sync] upserted ${upserted}/${rows.length}`);
}

const mysqlTotal = await mysql.blogPost.count({ where: { published: true } });
const mysqlFromMarch = await mysql.blogPost.count({
  where: { published: true, publishedAt: { gte: new Date('2026-03-01') } },
});
const mysqlFromJune = await mysql.blogPost.count({
  where: { published: true, publishedAt: { gte: new Date('2026-06-01') } },
});

console.log(
  JSON.stringify(
    {
      supabaseFetched: rows.length,
      upserted,
      supabaseFromMarchApprox: fromMarch,
      mysqlTotal,
      mysqlFromMarch,
      mysqlFromJune,
    },
    null,
    2
  )
);

await source.end();
await mysql.$disconnect();
