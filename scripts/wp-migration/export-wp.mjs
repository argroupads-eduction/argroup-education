#!/usr/bin/env node
/**
 * Export all WordPress pages & posts from argroupofeducation.com via REST API.
 * Output: data/wp-export/{pages,posts,manifest}.json
 *
 * Usage: node scripts/wp-migration/export-wp.mjs
 *        WP_BASE_URL=https://example.com node scripts/wp-migration/export-wp.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(REPO_ROOT, 'data', 'wp-export');

const WP_BASE = (process.env.WP_BASE_URL || 'https://argroupofeducation.com').replace(/\/$/, '');
const PER_PAGE = 100;
const DELAY_MS = Number(process.env.WP_EXPORT_DELAY_MS || '200');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function featuredImageUrl(item) {
  const media = item._embedded?.['wp:featuredmedia']?.[0];
  return media?.source_url || media?.media_details?.sizes?.full?.source_url || null;
}

function yoastMeta(item) {
  const y = item.yoast_head_json;
  if (!y) {
    return {
      metaTitle: null,
      metaDescription: null,
      canonicalUrl: null,
      keywords: [],
      ogImage: null,
    };
  }
  const ogImage = Array.isArray(y.og_image) ? y.og_image[0]?.url : y.og_image?.url;
  return {
    metaTitle: y.title || null,
    metaDescription: y.description || null,
    canonicalUrl: y.canonical || item.link || null,
    keywords: [],
    ogImage: ogImage || null,
  };
}

function normalizeItem(item, type) {
  const seo = yoastMeta(item);
  const title = item.title?.rendered || '';
  const content = item.content?.rendered || '';
  const excerpt = item.excerpt?.rendered || '';

  return {
    wpId: item.id,
    type,
    slug: item.slug,
    link: item.link,
    title,
    content,
    excerpt,
    status: item.status,
    date: item.date,
    modified: item.modified,
    featuredImage: featuredImageUrl(item) || seo.ogImage,
    ...seo,
  };
}

async function fetchAll(endpoint) {
  const items = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = new URL(`${WP_BASE}/wp-json/wp/v2/${endpoint}`);
    url.searchParams.set('per_page', String(PER_PAGE));
    url.searchParams.set('page', String(page));
    url.searchParams.set('status', 'publish');
    url.searchParams.set('_embed', 'wp:featuredmedia');

    process.stdout.write(`  ${endpoint} page ${page}... `);

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${endpoint} page ${page}: HTTP ${res.status} — ${body.slice(0, 200)}`);
    }

    const batch = await res.json();
    totalPages = Number(res.headers.get('x-wp-totalpages') || '1');
    const total = res.headers.get('x-wp-total');
    console.log(`${batch.length} items (total ${total})`);

    items.push(...batch);
    page += 1;
    if (page <= totalPages) await sleep(DELAY_MS);
  }

  return items;
}

async function main() {
  console.log(`Exporting from ${WP_BASE}`);
  console.log(`Output → ${OUT_DIR}\n`);

  await mkdir(OUT_DIR, { recursive: true });

  const [rawPages, rawPosts] = await Promise.all([
    (async () => {
      console.log('Fetching pages...');
      return fetchAll('pages');
    })(),
    (async () => {
      console.log('Fetching posts...');
      return fetchAll('posts');
    })(),
  ]);

  const pages = rawPages.map((p) => normalizeItem(p, 'page'));
  const posts = rawPosts.map((p) => normalizeItem(p, 'post'));

  const pageSlugs = new Set(pages.map((p) => p.slug));
  const slugCollisions = posts.filter((p) => pageSlugs.has(p.slug)).map((p) => p.slug);

  const manifest = {
    exportedAt: new Date().toISOString(),
    source: WP_BASE,
    counts: { pages: pages.length, posts: posts.length },
    slugCollisions,
    notes: [
      'Pages and posts use root URLs on WordPress (no /blog/ prefix on posts).',
      'Home page slug: mbbs-admission-in-top-colleges → URL /',
    ],
  };

  await writeFile(path.join(OUT_DIR, 'pages.json'), JSON.stringify(pages, null, 2), 'utf8');
  await writeFile(path.join(OUT_DIR, 'posts.json'), JSON.stringify(posts, null, 2), 'utf8');
  await writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log('\nDone.');
  console.log(`  Pages: ${pages.length}`);
  console.log(`  Posts: ${posts.length}`);
  if (slugCollisions.length) {
    console.warn(`  ⚠ Slug collisions (post+page same slug): ${slugCollisions.length}`);
    console.warn(`    ${slugCollisions.slice(0, 5).join(', ')}${slugCollisions.length > 5 ? '...' : ''}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
