/**
 * Import seed JSON into Strapi via API token (local SQLite or Hostinger Strapi MySQL).
 * Does NOT write marketing MySQL BlogPost tables directly.
 * Does NOT call the live website unless Strapi lifecycles sync is enabled on the target.
 *
 * Prereq:
 *   1. Seed JSON exists (already: 346/358)
 *   2. Target Strapi running with Full-access API token
 *
 * Usage (local):
 *   set STRAPI_URL=http://127.0.0.1:1337
 *   set STRAPI_TOKEN=...
 *   node scripts/strapi-import-seed-to-strapi.mjs
 *
 * Usage (Hostinger Strapi CMS subdomain — not www):
 *   set STRAPI_URL=https://cms.YOUR-DOMAIN
 *   set STRAPI_TOKEN=...
 *   set STRAPI_ALLOW_REMOTE_IMPORT=1
 *   node scripts/strapi-import-seed-to-strapi.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const seedDir = path.join(root, 'backups/pre-strapi-migration-2026-09-18/strapi-seed');

const STRAPI_URL = (process.env.STRAPI_URL || 'http://127.0.0.1:1337').replace(/\/$/, '');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 0;
const dryRun = process.argv.includes('--dry-run');

if (!STRAPI_TOKEN && !dryRun) {
  console.error('Set STRAPI_TOKEN (Strapi Settings → API Tokens). Or pass --dry-run.');
  process.exit(1);
}

// Refuse marketing frontend hosts; allow dedicated CMS URL when explicitly opted in
{
  const u = STRAPI_URL.toLowerCase();
  const isLocal = u.includes('127.0.0.1') || u.includes('localhost');
  const looksLikeMarketing =
    /(^https?:\/\/)?(www\.)?argroupofeducation\.com(\/|$)/i.test(u) ||
    /\/\/[a-z0-9-]+\.hostingersite\.com(\/|$)/i.test(u);
  // Temporary Hostinger marketing preview hosts look like color-animal-####.hostingersite.com
  // CMS may also use *.hostingersite.com — require opt-in + prefer cms. subdomain when remote.
  const allowRemote = process.env.STRAPI_ALLOW_REMOTE_IMPORT === '1';
  const looksLikeCms =
    u.includes('://cms.') ||
    u.includes('.cms.') ||
    u.includes('/cms.') ||
    /strapi/i.test(u);

  if (!isLocal) {
    if (looksLikeMarketing && !looksLikeCms) {
      console.error(
        'Refusing STRAPI_URL that looks like the marketing site (www / preview). Use the Strapi CMS URL.',
        STRAPI_URL
      );
      process.exit(1);
    }
    if (!allowRemote) {
      console.error(
        'Remote STRAPI_URL requires STRAPI_ALLOW_REMOTE_IMPORT=1 (Hostinger CMS only).',
        STRAPI_URL
      );
      process.exit(1);
    }
  }
}

function load(name) {
  return JSON.parse(fs.readFileSync(path.join(seedDir, name), 'utf8'));
}

function sanitizeSlug(raw, fallbackTitle) {
  // Prefer exact MySQL slug (string field, not uid) so Step 4 sync matches live URLs.
  let s = String(raw || '').trim();
  if (s) return s.slice(0, 255);
  s = String(fallbackTitle || 'item')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return (s || 'item').slice(0, 255);
}

function postPayload(row) {
  return {
    title: row.title,
    slug: sanitizeSlug(row.slug, row.title),
    content: row.content || '',
    excerpt: row.excerpt || '',
    featuredImage: row.featuredImage,
    category: row.category || 'Blog',
    tags: row.tags || [],
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    canonicalUrl: row.canonicalUrl,
    focusKeyword: row.focusKeyword,
    keywords: row.keywords || [],
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    ogImage: row.ogImage,
    twitterTitle: row.twitterTitle,
    twitterDescription: row.twitterDescription,
    schemaJson: row.schemaJson,
    author: row.author || 'AR Group',
    wpId: row.wpId,
    mysqlId: row.mysqlId,
    views: row.views || 0,
    legacyPublishedAt: row.publishedAt,
  };
}

function pagePayload(row) {
  return {
    title: row.title,
    slug: sanitizeSlug(row.slug, row.title),
    content: row.content || '',
    excerpt: row.excerpt,
    featuredImage: row.featuredImage,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    canonicalUrl: row.canonicalUrl,
    focusKeyword: row.focusKeyword,
    keywords: row.keywords || [],
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    ogImage: row.ogImage,
    twitterTitle: row.twitterTitle,
    twitterDescription: row.twitterDescription,
    schemaJson: row.schemaJson,
    navEnabled: !!row.navEnabled,
    navSection: row.navSection,
    navParent: row.navParent,
    navLabel: row.navLabel,
    navSortOrder: row.navSortOrder || 0,
    wpId: row.wpId,
    mysqlId: row.mysqlId,
    legacyPublishedAt: row.publishedAt,
  };
}

async function upsert(uid, payload, published) {
  const status = published ? 'published' : 'draft';
  if (dryRun) {
    console.log('[dry-run]', uid, payload.slug, status);
    return { ok: true };
  }

  // Strapi 5 Document API
  const res = await fetch(`${STRAPI_URL}/api/${uid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
    body: JSON.stringify({ data: payload, status }),
  });
  if (res.status === 400 || res.status === 409) {
    // try find by slug then put — best-effort
    const find = await fetch(
      `${STRAPI_URL}/api/${uid}?filters[slug][$eq]=${encodeURIComponent(payload.slug)}`,
      { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
    );
    const found = await find.json();
    const docId = found?.data?.[0]?.documentId || found?.data?.[0]?.id;
    if (docId) {
      const put = await fetch(`${STRAPI_URL}/api/${uid}/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
        body: JSON.stringify({ data: payload, status }),
      });
      const t = await put.text();
      if (!put.ok) throw new Error(`update ${uid} ${payload.slug}: ${put.status} ${t.slice(0, 200)}`);
      return { ok: true, updated: true };
    }
  }
  const text = await res.text();
  if (!res.ok) throw new Error(`create ${uid} ${payload.slug}: ${res.status} ${text.slice(0, 200)}`);
  return { ok: true };
}

const posts = load('posts.json');
const pages = load('pages.json');
const postList = LIMIT ? posts.slice(0, LIMIT) : posts;
const pageList = LIMIT ? pages.slice(0, LIMIT) : pages;

console.log('[strapi-import] target', STRAPI_URL, 'posts', postList.length, 'pages', pageList.length);
console.log('[strapi-import] LIVE MySQL write: NO | live website sync: NO');

let ok = 0;
let fail = 0;
for (const row of postList) {
  try {
    await upsert('posts', postPayload(row), row.published);
    ok++;
  } catch (e) {
    fail++;
    console.error('post fail', row.slug, e.message);
  }
}
for (const row of pageList) {
  try {
    await upsert('pages', pagePayload(row), row.published);
    ok++;
  } catch (e) {
    fail++;
    console.error('page fail', row.slug, e.message);
  }
}

console.log('[strapi-import] done ok=', ok, 'fail=', fail);
if (fail) process.exit(1);
