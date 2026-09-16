/**
 * Mirror college/country images from WP_MEDIA_ORIGIN into public/wp-content/.
 * Run once after setting WP_MEDIA_ORIGIN to your Hostinger/cPanel WordPress URL.
 *
 *   WP_MEDIA_ORIGIN=https://your-host.example.com node scripts/mirror-wp-college-images.mjs
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ORIGIN = (process.env.WP_MEDIA_ORIGIN || '').replace(/\/$/, '');

if (!ORIGIN) {
  console.error('Set WP_MEDIA_ORIGIN to your WordPress host (where wp-content still exists).');
  process.exit(1);
}

function collectUrls(obj, out = new Set()) {
  if (!obj || typeof obj !== 'object') return out;
  if (typeof obj.image === 'string' && obj.image.includes('wp-content/')) out.add(obj.image);
  if (typeof obj.featuredImage === 'string' && obj.featuredImage.includes('wp-content/')) {
    out.add(obj.featuredImage);
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) v.forEach((item) => collectUrls(item, out));
    else if (v && typeof v === 'object') collectUrls(v, out);
  }
  return out;
}

function wpPathFromUrl(url) {
  const m = url.match(/\/wp-content\/(.+)$/i);
  return m ? m[1] : null;
}

const india = JSON.parse(await readFile(path.join(ROOT, 'data/mbbs-india-tree.json'), 'utf8'));
const abroad = JSON.parse(await readFile(path.join(ROOT, 'data/mbbs-abroad-tree.json'), 'utf8'));
const urls = [...collectUrls(india), ...collectUrls(abroad)];

let ok = 0;
let fail = 0;

for (const url of urls) {
  const rel = wpPathFromUrl(url);
  if (!rel) continue;
  const dest = path.join(ROOT, 'public', 'wp-content', rel);
  await mkdir(path.dirname(dest), { recursive: true });

  try {
    const res = await fetch(`${ORIGIN}/wp-content/${rel}`, {
      signal: AbortSignal.timeout(60_000),
      headers: { 'User-Agent': 'ARGroupMediaMirror/1.0' },
    });
    if (!res.ok) {
      fail++;
      console.warn('FAIL', rel, res.status);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, buf);
    ok++;
    console.log('OK', rel);
  } catch (err) {
    fail++;
    console.warn('ERR', rel, err.message);
  }
}

console.log(`\nDone: ${ok} saved, ${fail} failed (${urls.size} unique URLs).`);
