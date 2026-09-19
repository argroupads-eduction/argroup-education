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
  console.error('Missing sync secret');
  process.exit(1);
}

const slug = 'strapi-step4-smoke-test';
const res = await fetch('https://www.argroupofeducation.com/api/cms/payload-sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secret}`,
  },
  body: JSON.stringify({
    type: 'post',
    slug,
    title: slug,
    content: '',
    published: false,
    pullFromCms: false,
  }),
});

const text = await res.text();
console.log('sync', res.status, text.slice(0, 400));
if (!res.ok) process.exit(1);

await new Promise((r) => setTimeout(r, 2000));
const page = await fetch(`https://www.argroupofeducation.com/blog/${slug}`, { redirect: 'follow' });
console.log('blog page', page.status);

const listing = await fetch('https://www.argroupofeducation.com/blog', { redirect: 'follow' });
const html = await listing.text();
console.log(
  'listing has smoke=',
  html.includes('Strapi Step 4 Smoke Test') || html.includes(slug)
);
