/**
 * Step 4 smoke: upsert a harmless test post via live payload-sync.
 * Does NOT delete other content. Uses thin-overwrite guards on server.
 *
 * Usage: node scripts/strapi-step4-smoke-sync.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localEnv = path.join(root, 'apps/frontend/.env.local');

function getSecret() {
  const text = fs.readFileSync(localEnv, 'utf8');
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    map[t.slice(0, i).trim()] = v;
  }
  return map.PAYLOAD_SYNC_SECRET || map.REVALIDATE_SECRET;
}

const secret = getSecret();
if (!secret) {
  console.error('Missing sync secret in .env.local');
  process.exit(1);
}

const slug = 'strapi-step4-smoke-test';
const body = {
  type: 'post',
  slug,
  title: 'Strapi Step 4 Smoke Test (safe to delete)',
  content:
    '<p>This is a temporary smoke-test post published from Strapi Step 4 cutover. It confirms Strapi → live MySQL sync works. You can unpublish/delete this post from Strapi or CMS sync.</p>'.repeat(
      3
    ),
  excerpt: 'Temporary Step 4 sync smoke test — safe to remove.',
  featuredImage: '/ar-group-logo.webp',
  category: 'Blog',
  tags: ['smoke-test'],
  keywords: ['strapi', 'smoke-test'],
  published: true,
  publishedAt: new Date().toISOString(),
  notifyPush: false,
  pullFromCms: false,
};

const url = 'https://www.argroupofeducation.com/api/cms/payload-sync';
console.log('[step4-smoke] POST', url, 'slug=', slug);

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secret}`,
  },
  body: JSON.stringify(body),
});

const text = await res.text();
console.log('[step4-smoke] status', res.status);
console.log('[step4-smoke] body', text.slice(0, 400));

if (!res.ok) process.exit(1);

// Verify public blog page (may need ISR wait)
await new Promise((r) => setTimeout(r, 2000));
const page = await fetch(`https://www.argroupofeducation.com/blog/${slug}`, {
  redirect: 'follow',
});
console.log('[step4-smoke] blog page', page.status, page.url);
const html = await page.text();
const ok = html.includes('Strapi Step 4 Smoke Test') || html.includes(slug);
console.log('[step4-smoke] content visible=', ok);
console.log('[step4-smoke] LIVE MySQL other posts: not deleted (upsert by slug only)');
