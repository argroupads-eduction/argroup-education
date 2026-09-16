/**
 * Fix college card images site-wide:
 * - Resolve missing slugs from WP pages
 * - Download images to public/wp-content/uploads/colleges/{slug}.ext
 * - Update mbbs-india-tree.json + mbbs-abroad-tree.json + college-image-index.json
 *
 *   WP_MEDIA_ORIGIN=https://argroupofeducation.com node scripts/ensure-college-card-images.mjs
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findCollegePageSlug, extractFirstContentImage } from '../../../scripts/lib/college-slug-match.mjs';
import { isJunkCollegeImage } from '../../../scripts/lib/college-image-quality.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'public', 'wp-content', 'uploads', 'colleges');
const ORIGIN = (process.env.WP_MEDIA_ORIGIN || 'https://argroupofeducation.com').replace(/\/$/, '');
const UPLOADS = path.join(ROOT, 'public', 'wp-content', 'uploads');

const pages = JSON.parse(readFileSync(path.join(ROOT, 'data/wp-export-bundle/pages.json'), 'utf8'));
const pageBySlug = new Map(pages.map((p) => [p.slug, p]));
const india = JSON.parse(readFileSync(path.join(ROOT, 'data/mbbs-india-tree.json'), 'utf8'));
const abroad = JSON.parse(readFileSync(path.join(ROOT, 'data/mbbs-abroad-tree.json'), 'utf8'));
const indexPath = path.join(ROOT, 'data/college-image-index.json');
const indexData = JSON.parse(readFileSync(indexPath, 'utf8'));
const bySlug = { ...indexData.bySlug };

mkdirSync(DEST, { recursive: true });

function wpRelFromUrl(url) {
  if (!url) return null;
  const m = String(url).match(/(?:wp-content\/uploads|api\/wp-media\/uploads)\/(.+)$/i);
  return m ? decodeURIComponent(m[1].replace(/\\/g, '/')) : null;
}

function localUploadPath(rel) {
  const direct = path.join(UPLOADS, rel);
  if (existsSync(direct) && statSync(direct).size > 500) return direct;
  const base = path.basename(rel);
  if (!existsSync(UPLOADS)) return null;
  for (const dir of walkDirs(UPLOADS)) {
    const hit = path.join(dir, base);
    if (existsSync(hit) && statSync(hit).size > 500) return hit;
  }
  return null;
}

function walkDirs(dir, out = []) {
  try {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) {
        out.push(full);
        walkDirs(full, out);
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

async function fetchRemote(rel) {
  const url = `${ORIGIN}/wp-content/uploads/${rel}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ARGroupCollegeImageFix/1.0', Accept: 'image/*,*/*' },
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.length > 500 ? buf : null;
}

async function ensureBundled(slug, sourceUrl) {
  if (!slug || !sourceUrl) return null;
  const rel = wpRelFromUrl(sourceUrl);
  if (!rel) return null;

  const ext = path.extname(rel) || '.jpg';
  const destFile = path.join(DEST, `${slug}${ext}`);
  const publicPath = `/wp-content/uploads/colleges/${slug}${ext}`;

  if (existsSync(destFile) && statSync(destFile).size > 500) {
    return publicPath;
  }

  let buf = null;
  const local = localUploadPath(rel);
  if (local) {
    copyFileSync(local, destFile);
    return publicPath;
  }

  buf = await fetchRemote(rel);
  if (!buf) {
    // try without size suffix e.g. -1024x500
    const base = path.basename(rel).replace(/-\d+x\d+(?=\.[^.]+$)/i, '');
    const altRel = path.posix.join(path.posix.dirname(rel), base);
    const localAlt = localUploadPath(altRel);
    if (localAlt) {
      copyFileSync(localAlt, destFile);
      return publicPath;
    }
    buf = await fetchRemote(altRel);
  }

  if (!buf) return null;
  writeFileSync(destFile, buf);
  return publicPath;
}

function bestImageUrl(slug, collegeImage, page) {
  const candidates = [
    bySlug[slug],
    collegeImage,
    page?.featuredImage,
    page?.ogImage,
    extractFirstContentImage(page?.content),
  ].filter(Boolean);

  for (const url of candidates) {
    const normalized = url.startsWith('http')
      ? url.replace(/^https?:\/\/(?:www\.)?argroupofeducation\.com/i, '')
      : url;
    const api = normalized.startsWith('/wp-content/')
      ? normalized.replace(/^\/wp-content\//, '/api/wp-media/')
      : normalized;
    if (!isJunkCollegeImage(api, slug)) return api;
  }
  return null;
}

async function fixCollege(college, context = {}) {
  let slug = college.slug;
  const city = college.city ?? context.city;

  if (!slug) {
    slug = findCollegePageSlug(college.name, pages, city);
  }

  const page = slug ? pageBySlug.get(slug) : null;
  if (!slug && page) slug = page.slug;

  const sourceUrl = bestImageUrl(slug, college.image, page);
  let bundled = slug && sourceUrl ? await ensureBundled(slug, sourceUrl) : null;

  if (!bundled && slug && bySlug[slug]) {
    bundled = await ensureBundled(slug, bySlug[slug]);
  }

  const changed = [];
  if (slug && college.slug !== slug) {
    college.slug = slug;
    changed.push('slug');
  }
  if (slug && college.href !== `/${slug}`) {
    college.href = `/${slug}`;
    changed.push('href');
  }
  if (bundled && college.image !== bundled) {
    college.image = bundled;
    changed.push('image');
  } else if (!bundled && sourceUrl && college.image !== sourceUrl) {
    college.image = sourceUrl;
    changed.push('image-api');
  }

  if (slug && college.image && !isJunkCollegeImage(college.image, slug)) {
    bySlug[slug] = college.image;
  }

  return { name: college.name, slug, image: college.image, changed, context };
}

const results = [];

for (const state of india.states) {
  for (const college of state.colleges) {
    results.push(await fixCollege(college, { state: state.name }));
  }
}

for (const country of abroad.countries) {
  for (const college of country.colleges ?? []) {
    results.push(await fixCollege(college, { country: country.name }));
  }
  for (const uni of country.universities ?? []) {
    for (const college of uni.colleges ?? []) {
      results.push(await fixCollege(college, { country: country.name, uni: uni.name }));
    }
  }
}

writeFileSync(path.join(ROOT, 'data/mbbs-india-tree.json'), `${JSON.stringify(india, null, 2)}\n`);
writeFileSync(path.join(ROOT, 'data/mbbs-abroad-tree.json'), `${JSON.stringify(abroad, null, 2)}\n`);
indexData.generatedAt = new Date().toISOString();
indexData.bySlug = bySlug;
indexData.count = Object.keys(bySlug).length;
writeFileSync(indexPath, `${JSON.stringify(indexData, null, 2)}\n`);

const fixed = results.filter((r) => r.changed.length);
const stillMissing = results.filter((r) => !r.image);

console.log(`Updated ${fixed.length} colleges`);
for (const r of fixed.slice(0, 40)) {
  console.log('FIX', r.name, '→', r.changed.join(', '), r.image || '(no image)');
}
if (fixed.length > 40) console.log(`... and ${fixed.length - 40} more`);

console.log(`\nStill missing image: ${stillMissing.length}`);
for (const r of stillMissing) {
  console.log('MISSING', r.name, r.slug || '(no slug)', r.context);
}
