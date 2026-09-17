/**
 * Build a lean page-content fallback for Amplify when MySQL is down and
 * pages.json is gitignored (~29MB).
 *
 *   node apps/backend/scripts/export-page-content-fallback.mjs
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const CRITICAL_SLUGS = [
  'mbbs',
  'bams-in-india',
  'neet-ug-counselling',
  'neet-pg-counselling',
  'education-consultancy-in-delhi-ncr',
  'md-ms',
  'md-ms-in-karnataka',
  'md-ms-in-haryana',
  'md-ms-in-madhya-pradesh',
  'md-ms-in-chhattisgarh',
  'md-ms-in-rajasthan',
  'md-ms-in-maharashtra',
  'md-ms-in-uttarakhand',
  'md-ms-in-tamil-nadu',
  'md-ms-colleges-in-uttar-pradesh',
  'md-ms-direct-admission',
  'neet-2026-syllabus',
  'neet-rank-predictor',
  'college-predictor',
];

const MD_MS_LOCAL_COVER = {
  'md-ms-colleges-in-uttar-pradesh': '/images/md-ms/up.jpeg',
  'md-ms-in-karnataka': '/images/md-ms/karnataka.jpeg',
  'md-ms-in-haryana': '/images/md-ms/haryana.jpeg',
  'md-ms-in-madhya-pradesh': '/images/md-ms/mp.jpeg',
  'md-ms-in-chhattisgarh': '/images/md-ms/chhattisgarh.jpeg',
  'md-ms-in-rajasthan': '/images/md-ms/rajasthan.jpeg',
  'md-ms-in-maharashtra': '/images/md-ms/maharashtra.jpeg',
  'md-ms-in-uttarakhand': '/images/md-ms/uttarakhand.jpeg',
  'md-ms-in-tamil-nadu': '/images/md-ms/tamil-nadu.jpeg',
};

function fromBundle() {
  const bundlePath = path.resolve(
    __dirname,
    '../../frontend/data/wp-export-bundle/pages.json'
  );
  if (!existsSync(bundlePath)) return [];
  const raw = JSON.parse(readFileSync(bundlePath, 'utf8'));
  const pages = Array.isArray(raw) ? raw : raw.pages || [];
  return pages.filter((p) => CRITICAL_SLUGS.includes(p.slug));
}

const prisma = new PrismaClient();
let rows = [];
try {
  rows = await prisma.sitePage.findMany({
    where: { published: true, slug: { in: CRITICAL_SLUGS } },
  });
} catch (e) {
  console.warn('[mysql]', e.message);
}

const bySlug = new Map();
for (const p of fromBundle()) {
  bySlug.set(p.slug, {
    id: String(p.wpId ?? p.slug),
    type: 'page',
    title: p.title,
    slug: p.slug,
    content: p.content || '',
    excerpt: p.excerpt || '',
    featuredImage: MD_MS_LOCAL_COVER[p.slug] || p.featuredImage || null,
    metaTitle: p.metaTitle || null,
    metaDescription: p.metaDescription || null,
    canonicalUrl: p.canonicalUrl || null,
    publishedAt: p.date || p.modified || null,
    updatedAt: p.modified || p.date || null,
  });
}
for (const p of rows) {
  const prev = bySlug.get(p.slug);
  bySlug.set(p.slug, {
    id: p.id,
    type: 'page',
    title: p.title,
    slug: p.slug,
    content: p.content || prev?.content || '',
    excerpt: p.excerpt || prev?.excerpt || '',
    featuredImage:
      MD_MS_LOCAL_COVER[p.slug] ||
      p.featuredImage ||
      prev?.featuredImage ||
      null,
    metaTitle: p.metaTitle || prev?.metaTitle || null,
    metaDescription: p.metaDescription || prev?.metaDescription || null,
    canonicalUrl: p.canonicalUrl || prev?.canonicalUrl || null,
    publishedAt: (p.publishedAt || p.createdAt)?.toISOString?.() || prev?.publishedAt,
    updatedAt: p.updatedAt?.toISOString?.() || prev?.updatedAt,
  });
}

const posts = [...bySlug.values()].filter((p) => (p.content || '').length > 100);
const dest = path.resolve(__dirname, '../../frontend/data/page-content-fallback.json');
writeFileSync(
  dest,
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    total: posts.length,
    posts,
  })
);
console.log(
  'wrote',
  dest,
  'count',
  posts.length,
  'mb',
  +(Buffer.byteLength(JSON.stringify(posts)) / 1024 / 1024).toFixed(2),
  'missing',
  CRITICAL_SLUGS.filter((s) => !bySlug.has(s) || (bySlug.get(s).content || '').length < 100)
);
await prisma.$disconnect();
