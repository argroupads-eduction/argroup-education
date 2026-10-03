/**
 * Call Hostinger Strapi force-marketing-sync for one slug.
 *
 *   node scripts/force-strapi-marketing-sync.mjs best-md-ms-colleges-in-uttar-pradesh
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2] || 'best-md-ms-colleges-in-uttar-pradesh';
const STRAPI_URL = (
  process.env.STRAPI_URL || 'https://mintcream-echidna-747154.hostingersite.com'
).replace(/\/$/, '');

function getSecret() {
  const text = fs.readFileSync(path.join(root, 'apps/frontend/.env.local'), 'utf8');
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('PAYLOAD_SYNC_SECRET=') || line.startsWith('REVALIDATE_SECRET=')) {
      return line
        .slice(line.indexOf('=') + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  }
  return '';
}

const secret = getSecret();
if (!secret) {
  console.error('Missing PAYLOAD_SYNC_SECRET');
  process.exit(1);
}

const url = `${STRAPI_URL}/api/posts/force-marketing-sync`;
console.log('POST', url, 'slug=', slug);
const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secret}`,
  },
  body: JSON.stringify({ slug }),
});
const text = await res.text();
console.log('status', res.status);
console.log(text.slice(0, 800));

await new Promise((r) => setTimeout(r, 2500));
const page = await fetch(`https://www.argroupofeducation.com/blog/${slug}`);
const html = await page.text();
console.log({
  liveStatus: page.status,
  title: (html.match(/<title>([^<]+)<\/title>/) || [])[1],
  soft404: /Not Found|could not be found/i.test(html),
});
