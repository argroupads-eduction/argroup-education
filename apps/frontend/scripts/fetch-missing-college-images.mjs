#!/usr/bin/env node
/** Fetch only colleges missing a bundled photo in public/wp-content/uploads/colleges/ */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isJunkCollegeImage,
  pickCollegePageImage,
} from '../../../scripts/lib/college-image-quality.mjs';
import {
  candidateRemotePaths,
  fetchFirstImageBuffer,
  wpRelFromUrl,
} from '../../../scripts/lib/college-image-fetch.mjs';
import { extractFirstContentImage } from '../../../scripts/lib/college-slug-match.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ORIGIN = (process.env.WP_MEDIA_ORIGIN || 'https://argroupofeducation.com').replace(/\/$/, '');
const DEST_DIR = path.join(ROOT, 'public', 'wp-content', 'uploads', 'colleges');
const INDEX_PATH = path.join(ROOT, 'data', 'college-image-index.json');
const PAGES = JSON.parse(readFileSync(path.join(ROOT, 'data/wp-export-bundle/pages.json'), 'utf8'));
const pageBySlug = new Map(PAGES.map((p) => [p.slug, p]));

/** Slug → wp-content relative path (uploads/...) when WP page has wrong/missing hero. */
const MANUAL_WP_OVERRIDES = {
  'hind-institute-of-medical-sciences-lucknow': 'uploads/2024/06/3ac2ba2e7d4a465f92ebcce82b8fb0df.webp',
};

/** Slug → absolute image URL when no valid WP export image exists. */
const EXTERNAL_OVERRIDES = {
  'kmc-medical-college': 'https://kmcmedicalcollege.com/assets/images/slider_image/1.jpg',
  'hind-institute-of-medical-sciences-lucknow':
    'https://himssitapur.org/wp-content/uploads/2023/06/new-front-pic.jpg',
  'noida-international-institute-of-medical-sciences':
    'https://niu.edu.in/wp-content/uploads/2022/11/NIIMS-banner-for-NIU-Website.jpg',
};

function hasLocal(slug) {
  if (!existsSync(DEST_DIR)) return false;
  return readdirSync(DEST_DIR).some((f) => f.startsWith(`${slug}.`));
}

function collectColleges() {
  const out = new Map();
  const india = JSON.parse(readFileSync(path.join(ROOT, 'data/mbbs-india-tree.json'), 'utf8'));
  const abroad = JSON.parse(readFileSync(path.join(ROOT, 'data/mbbs-abroad-tree.json'), 'utf8'));
  for (const s of india.states ?? []) {
    for (const c of s.colleges ?? []) {
      if (c.slug) out.set(c.slug, c.image ?? null);
    }
  }
  for (const c of abroad.countries ?? []) {
    for (const col of c.colleges ?? []) {
      if (col.slug) out.set(col.slug, col.image ?? null);
    }
    for (const u of c.universities ?? []) {
      for (const col of u.colleges ?? []) {
        if (col.slug) out.set(col.slug, col.image ?? null);
      }
    }
  }
  return out;
}

function pickSourceUrl(slug, treeImage, indexHit) {
  if (EXTERNAL_OVERRIDES[slug]) return EXTERNAL_OVERRIDES[slug];

  const manual = MANUAL_WP_OVERRIDES[slug];
  if (manual) return `${ORIGIN}/wp-content/${manual}`;

  const page = pageBySlug.get(slug);
  const featured = page?.featuredImage || extractFirstContentImage(page?.content) || null;
  const picked = pickCollegePageImage(slug, featured, page?.content ?? '');
  if (picked && !isJunkCollegeImage(picked, slug)) return picked;

  if (treeImage && !isJunkCollegeImage(treeImage, slug)) return treeImage;

  if (indexHit && !indexHit.startsWith('/wp-content/uploads/colleges/') && !isJunkCollegeImage(indexHit, slug)) {
    if (indexHit.startsWith('/api/wp-media/')) {
      return `${ORIGIN}/wp-content/${indexHit.replace(/^\/api\/wp-media\//, '')}`;
    }
    if (indexHit.startsWith('/wp-content/')) return `${ORIGIN}${indexHit}`;
  }

  return null;
}

async function main() {
  mkdirSync(DEST_DIR, { recursive: true });
  const index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
  const colleges = collectColleges();
  const slugs = [...colleges.keys()].filter((s) => !hasLocal(s));
  console.log(`Fetching ${slugs.length} missing college photos…`);

  let ok = 0;
  let skip = 0;
  for (const slug of slugs) {
    const source = pickSourceUrl(slug, colleges.get(slug), index.bySlug?.[slug]);
    if (!source) {
      skip++;
      continue;
    }

    const buf = await fetchFirstImageBuffer(candidateRemotePaths(source), ORIGIN);
    if (!buf) {
      skip++;
      continue;
    }

    const rel = wpRelFromUrl(source) || source;
    const ext = (rel.match(/\.(jpe?g|png|webp|gif|avif)(?:\?|$)/i)?.[1] || 'jpg').toLowerCase();
    const destRel = `colleges/${slug}.${ext === 'jpeg' ? 'jpg' : ext}`;
    writeFileSync(path.join(ROOT, 'public', 'wp-content', 'uploads', destRel), buf);
    index.bySlug[slug] = `/wp-content/uploads/${destRel}`;
    ok++;
    console.log('OK', slug);
  }

  index.count = Object.keys(index.bySlug).length;
  index.generatedAt = new Date().toISOString();
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  console.log(`Saved ${ok} new photos (${skip} still missing)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
