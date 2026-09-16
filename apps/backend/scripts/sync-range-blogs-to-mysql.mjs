/**
 * Upsert BlogPosts in [from, to) from Supabase into Hostinger MySQL (images + SEO).
 *   node apps/backend/scripts/sync-range-blogs-to-mysql.mjs
 */
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const FROM = process.env.SYNC_FROM || '2026-08-15';
const TO = process.env.SYNC_TO || '2026-09-16';

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
  return [];
}

const sourceUrl = loadSupabaseUrl();
if (!sourceUrl) {
  console.error('No Supabase URL');
  process.exit(1);
}

const source = new pg.Client({
  connectionString: sourceUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
});
const mysql = new PrismaClient();

try {
  await source.connect();
  const { rows } = await source.query(
    `
    SELECT
      id, "wpId", title, slug, content, excerpt, "featuredImage", category,
      tags, "metaTitle", "metaDescription", "canonicalUrl", "focusKeyword",
      keywords, "ogTitle", "ogDescription", "ogImage", "twitterTitle",
      "twitterDescription", "schemaJson", author, published, "publishedAt",
      views
    FROM "BlogPost"
    WHERE published = true
      AND "publishedAt" >= $1::timestamptz
      AND "publishedAt" < $2::timestamptz
    ORDER BY "publishedAt" ASC
  `,
    [FROM, TO]
  );

  console.log(`[range] ${FROM} .. ${TO} fetched=${rows.length}`);

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
      published: true,
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
          content: data.content || existing.content,
        },
      });
    } else {
      await mysql.blogPost.create({ data: { id: row.id || undefined, ...data } });
    }
    upserted++;
  }

  const verify = await mysql.blogPost.findMany({
    where: {
      published: true,
      publishedAt: { gte: new Date(FROM), lt: new Date(TO) },
    },
    orderBy: { publishedAt: 'asc' },
    select: {
      slug: true,
      publishedAt: true,
      featuredImage: true,
      metaTitle: true,
      content: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        upserted,
        mysqlInRange: verify.length,
        posts: verify.map((v) => ({
          slug: v.slug,
          publishedAt: v.publishedAt,
          hasImage: Boolean(v.featuredImage),
          hasMeta: Boolean(v.metaTitle),
          contentLen: (v.content || '').length,
          imageHost: v.featuredImage ? new URL(v.featuredImage).host : null,
        })),
      },
      null,
      2
    )
  );
} finally {
  await source.end().catch(() => undefined);
  await mysql.$disconnect().catch(() => undefined);
}
