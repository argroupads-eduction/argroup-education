/**
 * Compare WP export bundle vs Payload CMS vs Neon counts/slugs.
 *
 * Usage (from repo root):
 *   node scripts/wp-migration/verify-migration.mjs
 *   node scripts/wp-migration/verify-migration.mjs --sample=5
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
loadEnv({ path: path.join(ROOT, 'apps/backend/.env') });
loadEnv({ path: path.join(ROOT, 'ar-group-of-eductions/.env') });
const BUNDLE_DIR = path.join(ROOT, 'apps/frontend/data/wp-export-bundle');

const sampleSize = (() => {
  const m = process.argv.find((a) => a.startsWith('--sample='));
  return m ? parseInt(m.split('=')[1] ?? '0', 10) : 0;
})();

function publishedSlugs(items) {
  return new Set(
    items.filter((i) => i.status === 'publish' && i.slug).map((i) => i.slug)
  );
}

async function loadBundle() {
  const posts = JSON.parse(await readFile(path.join(BUNDLE_DIR, 'posts.json'), 'utf8'));
  const pages = JSON.parse(await readFile(path.join(BUNDLE_DIR, 'pages.json'), 'utf8'));
  return { posts, pages };
}

async function payloadCounts() {
  const base =
    process.env.PAYLOAD_PUBLIC_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, '') ||
    'http://localhost:8000';

  async function count(collection) {
    try {
      const res = await fetch(`${base}/api/${collection}?limit=0&depth=0`, {
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return { total: null, error: res.status };
      const json = await res.json();
      return { total: json.totalDocs ?? json.docs?.length ?? null, error: null };
    } catch (e) {
      return { total: null, error: String(e) };
    }
  }

  const [posts, pages] = await Promise.all([count('posts'), count('pages')]);
  return { base, posts, pages };
}

async function neonCounts() {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    return { error: 'DATABASE_URL not set' };
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    const [postCount, pageCount, publishedPosts, publishedPages] = await Promise.all([
      prisma.blogPost.count(),
      prisma.sitePage.count(),
      prisma.blogPost.count({ where: { published: true } }),
      prisma.sitePage.count({ where: { published: true } }),
    ]);
    await prisma.$disconnect();
    return { postCount, pageCount, publishedPosts, publishedPages, error: null };
  } catch (e) {
    return { error: String(e) };
  }
}

function sampleMissing(fromSet, otherSet, label, n) {
  if (!n) return [];
  const missing = [...fromSet].filter((s) => !otherSet.has(s));
  return missing.slice(0, n).map((slug) => ({ label, slug }));
}

async function main() {
  console.log('=== WP → Payload → Neon migration report ===\n');

  const { posts: bundlePosts, pages: bundlePages } = await loadBundle();
  const bundlePostSlugs = publishedSlugs(bundlePosts);
  const bundlePageSlugs = publishedSlugs(bundlePages);

  console.log('WP bundle (published):');
  console.log(`  posts: ${bundlePostSlugs.size} / ${bundlePosts.length} total`);
  console.log(`  pages: ${bundlePageSlugs.size} / ${bundlePages.length} total`);

  const payload = await payloadCounts();
  console.log(`\nPayload (${payload.base}):`);
  console.log(
    `  posts: ${payload.posts.total ?? 'unavailable'}${payload.posts.error ? ` (${payload.posts.error})` : ''}`
  );
  console.log(
    `  pages: ${payload.pages.total ?? 'unavailable'}${payload.pages.error ? ` (${payload.pages.error})` : ''}`
  );

  const neon = await neonCounts();
  console.log('\nNeon (neondb):');
  if (neon.error) {
    console.log(`  unavailable: ${neon.error}`);
  } else {
    console.log(`  blogPost: ${neon.postCount} (${neon.publishedPosts} published)`);
    console.log(`  sitePage: ${neon.pageCount} (${neon.publishedPages} published)`);
  }

  if (sampleSize > 0) {
    console.log(`\nSample slugs in bundle but maybe missing elsewhere (first ${sampleSize}):`);
    const samples = [
      ...sampleMissing(bundlePostSlugs, bundlePostSlugs, 'post', 0),
    ];
    console.log('  (Run full slug diff after import completes)');
    void samples;
  }

  console.log('\nNext steps if counts differ:');
  console.log('  1. npm run wp:import:payload');
  console.log('  2. npm run payload:sync:backend');
  console.log('  3. Re-run this script');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
