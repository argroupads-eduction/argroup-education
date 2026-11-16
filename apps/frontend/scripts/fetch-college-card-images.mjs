#!/usr/bin/env node
/**
 * Download college card images from live WordPress into public/wp-content/uploads/colleges/
 * and refresh college-image-index.json entries.
 *
 *   WP_MEDIA_ORIGIN=https://argroupofeducation.com node apps/frontend/scripts/fetch-college-card-images.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isJunkCollegeImage,
  pickCollegePageImage,
  elementorThumbPrefix,
} from '../../../scripts/lib/college-image-quality.mjs';
import { extractFirstContentImage } from '../../../scripts/lib/college-slug-match.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPO = path.resolve(ROOT, '..', '..');
const ORIGIN = (process.env.WP_MEDIA_ORIGIN || 'https://argroupofeducation.com').replace(/\/$/, '');
const DEST_DIR = path.join(ROOT, 'public', 'wp-content', 'uploads', 'colleges');
const INDEX_PATH = path.join(ROOT, 'data', 'college-image-index.json');
const PAGES_PATH = path.join(ROOT, 'data', 'wp-export-bundle', 'pages.json');

function wpRelFromUrl(url) {
  const m = String(url).match(/\/wp-content\/(.+)$/i);
  return m ? m[1] : null;
}

function candidateRemotePaths(url) {
  const rel = wpRelFromUrl(url);
  if (!rel) return [];

  const paths = new Set();
  paths.add(rel);

  const file = rel.split('/').pop() || '';
  const prefix = elementorThumbPrefix(file);
  const ext = file.match(/\.(jpe?g|png|webp|gif|avif)$/i)?.[1]?.toLowerCase();

  if (prefix && ext) {
    const base = `${prefix}.${ext}`;
    const dash = base.replace(/[\u2013\u2014]/g, '-');
    for (const year of ['2026', '2025', '2024', '2023', '2022']) {
      for (const month of ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']) {
        paths.add(`uploads/${year}/${month}/${base}`);
        paths.add(`uploads/${year}/${month}/${dash}`);
      }
    }
    paths.add(`uploads/${base}`);
    paths.add(`uploads/${dash}`);
  }

  if (rel.startsWith('uploads/')) paths.add(rel.replace(/^uploads\//, ''));

  return [...paths];
}

async function fetchFirst(urlPath) {
  const encoded = urlPath
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/');
  const url = `${ORIGIN}/wp-content/${encoded}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ARGroupCollegeFetcher/1.0', Accept: 'image/*,*/*' },
      signal: AbortSignal.timeout(45_000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/')) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function collectColleges() {
  const out = [];
  const india = JSON.parse(readFileSync(path.join(ROOT, 'data/mbbs-india-tree.json'), 'utf8'));
  const abroad = JSON.parse(readFileSync(path.join(ROOT, 'data/mbbs-abroad-tree.json'), 'utf8'));

  for (const state of india.states ?? []) {
    for (const c of state.colleges ?? []) {
      if (c.slug) out.push({ slug: c.slug, image: c.image });
    }
  }
  for (const country of abroad.countries ?? []) {
    for (const c of country.colleges ?? []) {
      if (c.slug) out.push({ slug: c.slug, image: c.image });
    }
    for (const u of country.universities ?? []) {
      for (const c of u.colleges ?? []) {
        if (c.slug) out.push({ slug: c.slug, image: c.image });
      }
    }
  }
  return out;
}

async function main() {
  mkdirSync(DEST_DIR, { recursive: true });
  const pages = JSON.parse(readFileSync(PAGES_PATH, 'utf8'));
  const pageBySlug = new Map(pages.map((p) => [p.slug, p]));
  const index = existsSync(INDEX_PATH)
    ? JSON.parse(readFileSync(INDEX_PATH, 'utf8'))
  : { bySlug: {} };

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const { slug } of collectColleges()) {
    const page = pageBySlug.get(slug);
    const featured = page?.featuredImage || extractFirstContentImage(page?.content) || null;
    const picked = pickCollegePageImage(slug, featured, page?.content ?? '');
    if (!picked || isJunkCollegeImage(picked, slug)) {
      skip++;
      continue;
    }

    const ext = (picked.match(/\.(jpe?g|png|webp|gif|avif)(?:\?|$)/i)?.[1] || 'jpg').toLowerCase();
    const destRel = `colleges/${slug}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const destAbs = path.join(ROOT, 'public', 'wp-content', 'uploads', destRel);

    let buf = null;
    for (const candidate of candidateRemotePaths(picked)) {
      buf = await fetchFirst(candidate);
      if (buf && buf.length > 4_000) break;
      buf = null;
    }

    if (!buf) {
      fail++;
      continue;
    }

    writeFileSync(destAbs, buf);
    index.bySlug[slug] = `/wp-content/uploads/${destRel}`;
    ok++;
    if (ok % 20 === 0) console.log(`...${ok} saved`);
  }

  index.generatedAt = new Date().toISOString();
  index.count = Object.keys(index.bySlug).length;
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));

  console.log(`Done: ${ok} saved, ${skip} skipped (no valid pick), ${fail} fetch failed`);
  console.log(`Index: ${index.count} slugs → ${INDEX_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
