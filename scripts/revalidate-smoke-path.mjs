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
const slug = 'strapi-step4-smoke-test';

const rev = await fetch('https://www.argroupofeducation.com/api/revalidate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secret}`,
  },
  body: JSON.stringify({
    type: 'post',
    slug,
    paths: [`/blog/${slug}`, `/blog/${encodeURIComponent(slug)}`],
  }),
});
console.log('revalidate', rev.status, (await rev.text()).slice(0, 400));

await new Promise((r) => setTimeout(r, 2500));
for (const u of [
  `https://www.argroupofeducation.com/blog/${slug}`,
  'https://www.argroupofeducation.com/blog',
  'https://www.argroupofeducation.com/',
]) {
  const page = await fetch(u, {
    redirect: 'follow',
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
  const html = await page.text();
  const hit =
    html.includes('Strapi Step 4 Smoke Test') ||
    html.includes('Temporary Step 4 sync smoke') ||
    html.includes(slug);
  console.log(page.status, 'smoke=', hit, u);
}
