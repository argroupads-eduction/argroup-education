/**
 * Re-fetch featured images from live article hero only (not page chrome).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const postsPath = path.join(root, 'apps/frontend/data/wp-export-bundle/posts.json');
const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));

const JUNK = /WhatsApp-Image-2024-12-12-at-9\.32\.58-AM|ar-group-logo|ar-browser-icon/i;

function toStatic(url) {
  if (!url) return null;
  if (JUNK.test(url)) return null;
  if (url.startsWith('/api/wp-media/')) return `/wp-content/${url.replace(/^\/api\/wp-media\//, '')}`;
  if (url.startsWith('/wp-content/')) return url;
  const m = url.match(/argroupofeducation\.com\/(wp-content\/uploads\/[^?\s#]+)/i);
  if (m) return `/${m[1]}`;
  return null;
}

function pickFromHtml(html) {
  const patterns = [
    /class="[^"]*blog-post-hero[^"]*"[\s\S]{0,2500}?src="([^"]+)"/i,
    /class="[^"]*blog-image-frame--hero[^"]*"[\s\S]{0,400}?src="([^"]+)"/i,
    /property=["']og:image["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+property=["']og:image["']/i,
    /name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
    /<article[\s\S]{0,8000}?<img[^>]+src=["']([^"']*wp-content\/uploads\/[^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    const url = toStatic(m?.[1]);
    if (url) return url;
  }
  return null;
}

async function fetchLiveImage(slug) {
  const urls = [
    `https://argroupofeducation.com/blog/${encodeURIComponent(slug)}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
      if (!res.ok) continue;
      const html = await res.text();
      const picked = pickFromHtml(html);
      if (picked) return picked;
    } catch {
      /* next */
    }
  }
  return null;
}

let filled = 0;
for (const post of posts) {
  if (post.featuredImage && !JUNK.test(post.featuredImage)) continue;
  const live = await fetchLiveImage(post.slug);
  if (live) {
    post.featuredImage = live;
    filled++;
    console.log('ok', post.slug, '→', live);
  } else if (!post.featuredImage) {
    console.log('miss', post.slug);
  }
}

fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2) + '\n');
console.log('filled', filled);
