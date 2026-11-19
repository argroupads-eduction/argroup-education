
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'apps/strapi/package.json'));
const mysql = require('mysql2/promise');

const SLUGS = [
  'top-10-pg-medical-colleges-in-uttar-pradesh',
  'top-10-pg-medical-colleges-in-india',
  'medical-courses-after-mbbs',
  'neet-pg-2026-expected-cutoff',
];

const STRAPI_URL = (
  process.env.STRAPI_URL || 'https://mintcream-echidna-747154.hostingersite.com'
).replace(/\/$/, '');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

function parseEnv(file) {
  const map = {};
  if (!fs.existsSync(file)) return map;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i < 1) continue;
    map[line.slice(0, i).trim()] = line
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return map;
}

function toIso(d) {
  if (!d) return null;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}

async function loadFromMarketing() {
  const fe = parseEnv(path.join(root, 'apps/frontend/.env.local'));
  if (!fe.DATABASE_URL) throw new Error('Missing DATABASE_URL in apps/frontend/.env.local');
  const u = new URL(fe.DATABASE_URL);
  const conn = await mysql.createConnection({
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
    connectTimeout: 20000,
  });
  const [rows] = await conn.query(
    `SELECT slug, title, content, excerpt, featuredImage, ogImage, category,
            metaTitle, metaDescription, canonicalUrl, focusKeyword, keywords,
            tags, schemaJson, author, published, publishedAt
     FROM BlogPost WHERE slug IN (?, ?, ?, ?)`,
    SLUGS
  );
  await conn.end();
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const ordered = SLUGS.map((s) => bySlug.get(s)).filter(Boolean);
  if (ordered.length !== SLUGS.length) {
    const missing = SLUGS.filter((s) => !bySlug.has(s));
    throw new Error(`Marketing missing slugs: ${missing.join(', ')}`);
  }
  return ordered;
}

function postPayload(row) {
  const publishedAt = toIso(row.publishedAt);
  let keywords = row.keywords;
  if (typeof keywords === 'string') {
    try {
      keywords = JSON.parse(keywords);
    } catch {
      keywords = keywords.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  let tags = row.tags;
  if (typeof tags === 'string') {
    try {
      tags = JSON.parse(tags);
    } catch {
      tags = [];
    }
  }
  let schemaJson = row.schemaJson;
  if (typeof schemaJson === 'string') {
    try {
      schemaJson = JSON.parse(schemaJson);
    } catch {
      schemaJson = null;
    }
  }
  return {
    title: row.title,
    slug: row.slug,
    content: row.content || '',
    excerpt: row.excerpt || '',
    featuredImage: row.featuredImage || '',
    ogImage: row.ogImage || row.featuredImage || '',
    category: row.category || 'Blog',
    metaTitle: row.metaTitle || row.title,
    metaDescription: row.metaDescription || row.excerpt || '',
    canonicalUrl: row.canonicalUrl || null,
    focusKeyword: row.focusKeyword || null,
    keywords: keywords || [],
    tags: tags || [],
    schemaJson: schemaJson,
    author: row.author || 'AR Group',
    legacyPublishedAt: publishedAt,
  };
}

async function findBySlug(slug) {
  const res = await fetch(
    `${STRAPI_URL}/api/posts?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1&status=draft`,
    { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // try without status=draft
    const res2 = await fetch(
      `${STRAPI_URL}/api/posts?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`,
      { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
    );
    const body2 = await res2.json().catch(() => ({}));
    if (!res2.ok) throw new Error(`find ${slug}: ${res.status}/${res2.status}`);
    return body2?.data?.[0] || null;
  }
  return body?.data?.[0] || null;
}

async function upsertPost(row) {
  const payload = postPayload(row);
  const published = !!row.published;
  const status = published ? 'published' : 'draft';
  const existing = await findBySlug(row.slug);
  const docId = existing?.documentId || existing?.id;

  if (docId) {
    const put = await fetch(`${STRAPI_URL}/api/posts/${docId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({ data: payload, status }),
    });
    const text = await put.text();
    if (!put.ok) throw new Error(`update ${row.slug}: ${put.status} ${text.slice(0, 300)}`);
    return { action: 'updated', slug: row.slug };
  }

  const post = await fetch(`${STRAPI_URL}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
    body: JSON.stringify({ data: payload, status }),
  });
  const text = await post.text();
  if (!post.ok) throw new Error(`create ${row.slug}: ${post.status} ${text.slice(0, 300)}`);
  return { action: 'created', slug: row.slug };
}

async function main() {
  if (!STRAPI_TOKEN) {
    console.error(`
Missing STRAPI_TOKEN.

Hostinger Strapi Admin → Settings → API Tokens → Create new API Token
  Name: import-ss-blogs
  Token type: Full access
  Duration: Unlimited (or 7 days)

Then PowerShell:
  $env:STRAPI_URL = "https://mintcream-echidna-747154.hostingersite.com"
  $env:STRAPI_TOKEN = "paste-token-here"
  node scripts/import-ss-blogs-to-hostinger-strapi.mjs
`);
    process.exit(2);
  }

  console.log('[import] target', STRAPI_URL);
  const rows = await loadFromMarketing();
  console.log(
    '[import] loaded',
    rows.map((r) => ({ slug: r.slug, img: Boolean(r.featuredImage), at: toIso(r.publishedAt) }))
  );

  for (const row of rows) {
    const r = await upsertPost(row);
    console.log('[import]', r.action, r.slug);
  }
  console.log('[import] done. Hard-refresh Strapi Content Manager → Post (Blog).');
  console.log(
    '[import] Tip: Settings cog → show legacyPublishedAt / Published → sort DESC so newest is on top.'
  );
}

main().catch((e) => {
  console.error('[import] FAIL', e.message || e);
  process.exit(1);
});
