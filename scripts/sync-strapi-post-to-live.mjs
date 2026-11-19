/**
 * Pull one published Post from Hostinger Strapi API and upsert to live www.
 *
 * PowerShell:
 *   $env:STRAPI_URL = "https://mintcream-echidna-747154.hostingersite.com"
 *   $env:STRAPI_TOKEN = "<Full access token from Strapi Admin → Settings → API Tokens>"
 *   node scripts/sync-strapi-post-to-live.mjs best-md-ms-colleges-in-uttar-pradesh
 *
 * Secret for www comes from apps/frontend/.env.local (PAYLOAD_SYNC_SECRET).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node scripts/sync-strapi-post-to-live.mjs <slug>');
  process.exit(1);
}

const STRAPI_URL = (
  process.env.STRAPI_URL || 'https://mintcream-echidna-747154.hostingersite.com'
).replace(/\/$/, '');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';
if (!STRAPI_TOKEN) {
  console.error(
    'Missing STRAPI_TOKEN. Create Full access token in Strapi Admin → Settings → API Tokens.'
  );
  process.exit(1);
}

function parseEnv(file) {
  const map = {};
  if (!fs.existsSync(file)) return map;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    map[t.slice(0, i).trim()] = v;
  }
  return map;
}

const fe = parseEnv(path.join(root, 'apps/frontend/.env.local'));
const secret = fe.PAYLOAD_SYNC_SECRET || fe.REVALIDATE_SECRET;
if (!secret) {
  console.error('Missing PAYLOAD_SYNC_SECRET in apps/frontend/.env.local');
  process.exit(1);
}

async function fetchPost() {
  const q = new URLSearchParams({
    'filters[slug][$eq]': slug,
    'pagination[pageSize]': '1',
    status: 'published',
    populate: 'featuredMedia',
  });
  let res = await fetch(`${STRAPI_URL}/api/posts?${q}`, {
    headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
  });
  let json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.data?.length) {
    // draft/published dual — try without status
    const q2 = new URLSearchParams({
      'filters[slug][$eq]': slug,
      'pagination[pageSize]': '5',
      populate: 'featuredMedia',
    });
    res = await fetch(`${STRAPI_URL}/api/posts?${q2}`, {
      headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
    });
    json = await res.json().catch(() => ({}));
  }
  if (!res.ok) {
    throw new Error(`Strapi ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  }
  const rows = Array.isArray(json.data) ? json.data : [];
  if (!rows.length) throw new Error(`No post for slug ${slug}`);
  // Prefer published
  const row =
    rows.find((r) => r.publishedAt || r.attributes?.publishedAt) || rows[0];
  return row.attributes ? { id: row.id, documentId: row.documentId, ...row.attributes } : row;
}

const post = await fetchPost();
const media =
  post.featuredMedia?.data?.attributes ||
  post.featuredMedia?.attributes ||
  post.featuredMedia ||
  null;

const publishedAt = post.legacyPublishedAt || post.publishedAt || new Date().toISOString();
const featuredImage =
  post.featuredImage ||
  (media?.url
    ? /^https?:/i.test(media.url)
      ? media.url
      : `${STRAPI_URL}${media.url.startsWith('/') ? '' : '/'}${media.url}`
    : null);

const body = {
  type: 'post',
  slug: post.slug,
  title: post.title,
  content: post.content || '',
  excerpt: post.excerpt || '',
  featuredImage,
  ogImage: post.ogImage || null,
  category: post.category || 'Blog',
  author: post.author || null,
  metaTitle: post.metaTitle || null,
  metaDescription: post.metaDescription || null,
  canonicalUrl: post.canonicalUrl || null,
  focusKeyword: post.focusKeyword || null,
  keywords: post.keywords || [],
  tags: post.tags || [],
  schemaJson: post.schemaJson || null,
  published: true,
  publishedAt,
  legacyPublishedAt: publishedAt,
  notifyPush: false,
  pullFromCms: false,
};

console.log('Syncing', {
  slug: body.slug,
  title: body.title,
  contentLen: body.content.length,
  featuredImage: body.featuredImage,
  publishedAt: body.publishedAt,
});

const syncRes = await fetch(
  'https://www.argroupofeducation.com/api/cms/payload-sync',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
  }
);
const syncText = await syncRes.text();
console.log('payload-sync', syncRes.status, syncText.slice(0, 400));
if (!syncRes.ok) process.exit(1);

await new Promise((r) => setTimeout(r, 2000));
const page = await fetch(`https://www.argroupofeducation.com/blog/${slug}`);
const html = await page.text();
console.log({
  live: page.status,
  hasTitle: html.includes(body.title),
  soft404: /Not Found \| AR Group/i.test(html),
});
