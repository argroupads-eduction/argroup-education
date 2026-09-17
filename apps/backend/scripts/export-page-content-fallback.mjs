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
  // MBBS Abroad country guides
  'study-mbbs-in-abroad',
  'study-mbbs-in-russia',
  'study-mbbs-in-nepal',
  'study-mbbs-in-bangladesh',
  'study-mbbs-in-uzbekistan',
  'mbbs-in-kazakhstan',
  'mbbs-in-serbia',
  'mbbs-in-iran',
  'mbbs-in-bosnia',
  'mbbs-in-egypt',
  'mbbs-in-vietnam',
  'study-mbbs-in-kyrgyzstan',
  'mbbs-in-philippines-3-2',
  'mbbs-in-georgia',
  'study-mbbs-in-china',
  'mbbs-in-romania',
  'mbbs-in-asia',
  // MBBS India hub + states
  'mbbs-in-india',
  'mbbs-in-delhi',
  'mbbs-in-up',
  'mbbs-in-haryana',
  'mbbs-in-rajasthan',
  'mbbs-in-maharashtra',
  'mbbs-in-karnataka',
  'mbbs-in-madhya-pradesh',
  'mbbs-in-bihar',
  'mbbs-in-uttarakhand',
  'mbbs-in-himachal-pradesh',
  'mbbs-in-jharkhand',
  'mbbs-in-chhattisgarh',
  'mbbs-in-sikkim',
  'mbbs-in-pondicherry',
  'mbbs-in-kerala',
  'mbbs-in-west-bengal',
  'mbbs-in-tamil-nadu',
];

const LOCAL_FEATURED_COVER = {
  'md-ms-colleges-in-uttar-pradesh': '/images/md-ms/up.jpeg',
  'md-ms-in-karnataka': '/images/md-ms/karnataka.jpeg',
  'md-ms-in-haryana': '/images/md-ms/haryana.jpeg',
  'md-ms-in-madhya-pradesh': '/images/md-ms/mp.jpeg',
  'md-ms-in-chhattisgarh': '/images/md-ms/chhattisgarh.jpeg',
  'md-ms-in-rajasthan': '/images/md-ms/rajasthan.jpeg',
  'md-ms-in-maharashtra': '/images/md-ms/maharashtra.jpeg',
  'md-ms-in-uttarakhand': '/images/md-ms/uttarakhand.jpeg',
  'md-ms-in-tamil-nadu': '/images/md-ms/tamil-nadu.jpeg',
  mbbs: '/images/page-featured/mbbs.jpeg',
  'bams-in-india': '/images/page-featured/bams-in-india.jpeg',
  'md-ms': '/images/page-featured/md-ms.jpeg',
  'study-mbbs-in-russia': '/mbbs-russia-hero.png',
  'study-mbbs-in-nepal': '/mbbs-nepal-hero.png',
  'study-mbbs-in-bangladesh': '/mbbs-bangladesh-hero.png',
  'study-mbbs-in-uzbekistan': '/mbbs-uzbekistan-hero.png',
  'mbbs-in-kazakhstan': '/mbbs-kazakhstan-hero.png',
  'mbbs-in-serbia': '/mbbs-serbia-hero.png',
  'mbbs-in-iran': '/mbbs-iran-hero.png',
  'mbbs-in-bosnia': '/mbbs-bosnia-hero.png',
  'mbbs-in-egypt': '/mbbs-egypt-hero.png',
  'mbbs-in-vietnam': '/mbbs-vietnam-hero.png',
  'study-mbbs-in-kyrgyzstan': '/mbbs-kyrgyzstan-hero.png',
  'mbbs-in-philippines-3-2': '/mbbs-philippines-hero.png',
  'mbbs-in-georgia': '/mbbs-georgia-hero.png',
  'study-mbbs-in-china': '/mbbs-china-hero.png',
  'mbbs-in-romania': '/mbbs-romania-hero.png',
  'mbbs-in-asia': '/mbbs-china-hero.png',
  'mbbs-in-india': '/states/mbbs-in-india.png',
  'mbbs-in-delhi': '/states/delhi.png',
  'mbbs-in-up': '/states/uttar-pradesh.png',
  'mbbs-in-haryana': '/states/haryana.png',
  'mbbs-in-rajasthan': '/states/rajasthan.png',
  'mbbs-in-maharashtra': '/states/maharashtra.png',
  'mbbs-in-karnataka': '/states/karnataka.png',
  'mbbs-in-madhya-pradesh': '/states/madhya-pradesh.png',
  'mbbs-in-bihar': '/states/bihar.png',
  'mbbs-in-uttarakhand': '/states/uttarakhand.png',
  'mbbs-in-himachal-pradesh': '/states/himachal-pradesh.png',
  'mbbs-in-jharkhand': '/states/jharkhand.png',
  'mbbs-in-chhattisgarh': '/states/chhattisgarh.png',
  'mbbs-in-sikkim': '/states/sikkim.png',
  'mbbs-in-pondicherry': '/states/pondicherry.png',
  'mbbs-in-kerala': '/states/kerala.png',
  'mbbs-in-west-bengal': '/states/west-bengal.png',
  'mbbs-in-tamil-nadu': '/states/tamil-nadu.png',
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
    featuredImage: LOCAL_FEATURED_COVER[p.slug] || p.featuredImage || null,
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
      LOCAL_FEATURED_COVER[p.slug] ||
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
