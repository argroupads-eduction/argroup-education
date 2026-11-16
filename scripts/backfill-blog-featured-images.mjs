/**
 * Backfill missing blog featuredImage from college-image-index + live site HTML.
 * Run: node scripts/backfill-blog-featured-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const postsPath = path.join(root, 'apps/frontend/data/wp-export-bundle/posts.json');
const indexPath = path.join(root, 'apps/frontend/data/college-image-index.json');

const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
const bySlug = JSON.parse(fs.readFileSync(indexPath, 'utf8')).bySlug || {};

function toStatic(url) {
  if (!url) return null;
  if (url.startsWith('/api/wp-media/')) return `/wp-content/${url.replace(/^\/api\/wp-media\//, '')}`;
  if (url.startsWith('/wp-content/')) return url;
  const m = url.match(/argroupofeducation\.com\/(wp-content\/uploads\/[^?\s#]+)/i);
  if (m) return `/${m[1]}`;
  return null;
}

async function fetchLiveImage(slug) {
  const urls = [
    `https://argroupofeducation.com/blog/${slug}`,
    `https://argroupofeducation.com/${slug}/`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
      if (!res.ok) continue;
      const html = await res.text();
      const og =
        html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
        html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
      if (og?.[1]) {
        const staticUrl = toStatic(og[1]);
        if (staticUrl) return staticUrl;
      }
      const upload = html.match(/\/wp-content\/uploads\/[0-9]{4}\/[0-9]{2}\/[^"'\\\s>]+\.(?:png|jpe?g|webp)/i);
      if (upload) return upload[0];
    } catch {
      /* try next */
    }
  }
  return null;
}

let filled = 0;
const missing = [];

for (const post of posts) {
  if (post.featuredImage) continue;

  const fromIndex = bySlug[post.slug] ? toStatic(bySlug[post.slug]) : null;
  if (fromIndex) {
    post.featuredImage = fromIndex;
    filled++;
    console.log('index', post.slug, '→', fromIndex);
    continue;
  }

  missing.push(post);
}

console.log(`\nFilled from index: ${filled}. Fetching live for ${missing.length}…`);

for (const post of missing) {
  const live = await fetchLiveImage(post.slug);
  if (live) {
    post.featuredImage = live;
    filled++;
    console.log('live', post.slug, '→', live);
  } else {
    console.log('still-missing', post.slug);
  }
}

fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2) + '\n');
console.log(`\nDone. Total filled this run: ${filled}`);
