/**
 * Build slug → local/API image path index from WP export, program trees, and uploads scan.
 *
 *   node apps/frontend/scripts/build-college-image-index.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractFirstContentImage } from '../../../scripts/lib/college-slug-match.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WP_CONTENT = path.join(ROOT, 'public', 'wp-content');
const UPLOADS = path.join(WP_CONTENT, 'uploads');
const OUT = path.join(ROOT, 'data', 'college-image-index.json');

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walkFiles(full, out);
    else if (/\.(jpe?g|png|webp|gif|avif|svg)$/i.test(name)) out.push(full);
  }
  return out;
}

const allFiles = walkFiles(UPLOADS);

function relFromUploads(abs) {
  return path.relative(UPLOADS, abs).replace(/\\/g, '/');
}

function toApiPath(uploadsRelative) {
  return `/api/wp-media/uploads/${uploadsRelative}`;
}

function toPublicCollegesPath(uploadsRelative) {
  if (uploadsRelative.startsWith('colleges/')) {
    return `/wp-content/uploads/${uploadsRelative}`;
  }
  return toApiPath(uploadsRelative);
}

function wpRelFromUrl(url) {
  const m = String(url).match(/\/wp-content\/(.+)$/i);
  return m ? m[1].replace(/^uploads\//, '') : null;
}

function resolveExactWpUrl(url) {
  const rel = wpRelFromUrl(url);
  if (!rel) return null;
  const direct = path.join(UPLOADS, rel);
  if (existsSync(direct)) return toPublicCollegesPath(rel);

  const basename = path.basename(rel);
  const hit = allFiles.find((f) => path.basename(f).toLowerCase() === basename.toLowerCase());
  if (hit) return toPublicCollegesPath(relFromUploads(hit));

  return resolveElementorThumb(basename);
}

function resolveElementorThumb(filename) {
  const match = filename.match(/^(.+)-[a-z0-9]{16,}\.(jpe?g|png|webp|gif|avif)$/i);
  if (!match) return null;
  const prefix = match[1].toLowerCase();
  const ext = match[2].toLowerCase();

  const candidates = allFiles.filter((f) => {
    const base = path.basename(f).toLowerCase();
    return base.includes(prefix.slice(0, Math.min(prefix.length, 24))) && base.endsWith(`.${ext}`);
  });

  if (!candidates.length) {
    const loose = allFiles.filter((f) => path.basename(f).toLowerCase().includes(prefix.slice(0, 16)));
    if (loose.length) {
      const best = loose.sort((a, b) => path.basename(a).length - path.basename(b).length)[0];
      return toApiPath(relFromUploads(best));
    }
    return null;
  }

  const best = candidates.sort((a, b) => {
    const score = (f) => {
      const bname = path.basename(f).toLowerCase();
      let s = 0;
      if (bname.startsWith(prefix)) s += 10;
      if (!/-\d+x\d+/.test(bname)) s += 5;
      if (bname.endsWith(`.${ext}`)) s += 2;
      return s - bname.length * 0.001;
    };
    return score(b) - score(a);
  })[0];

  return toApiPath(relFromUploads(best));
}

function slugTokens(slug) {
  return String(slug)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

function resolveBySlug(slug) {
  const tokens = slugTokens(slug);
  if (!tokens.length) return null;

  let best = null;
  let bestScore = 0;
  for (const f of allFiles) {
    const name = path.basename(f).toLowerCase();
    const score = tokens.reduce((n, t) => (name.includes(t) ? n + 1 : n), 0);
    if (score > bestScore && score >= Math.min(2, tokens.length)) {
      best = f;
      bestScore = score;
    }
  }
  return best ? toApiPath(relFromUploads(best)) : null;
}

function pickBest(slug, ...urls) {
  for (const url of urls) {
    if (!url) continue;
    const exact = resolveExactWpUrl(url);
    if (exact) return exact;
  }
  return resolveBySlug(slug);
}

const index = {};

function add(slug, url, source) {
  if (!slug || !url) return;
  const resolved = pickBest(slug, url) ?? resolveBySlug(slug);
  if (!resolved) return;
  if (!index[slug] || source === 'featured') {
    index[slug] = resolved;
  }
}

const bundleDir = path.join(ROOT, 'data', 'wp-export-bundle');
for (const file of ['pages.json', 'posts.json']) {
  const fp = path.join(bundleDir, file);
  if (!existsSync(fp)) continue;
  const rows = JSON.parse(readFileSync(fp, 'utf8'));
  for (const row of rows) {
    if (!row.slug) continue;
    const image = row.featuredImage || extractFirstContentImage(row.content);
    if (image) add(row.slug, image, 'featured');
  }
}

const india = JSON.parse(readFileSync(path.join(ROOT, 'data/mbbs-india-tree.json'), 'utf8'));
for (const state of india.states) {
  for (const c of state.colleges) {
    if (c.slug) add(c.slug, c.image, 'tree');
  }
}

const abroad = JSON.parse(readFileSync(path.join(ROOT, 'data/mbbs-abroad-tree.json'), 'utf8'));
for (const country of abroad.countries) {
  for (const c of country.colleges ?? []) {
    if (c.slug) add(c.slug, c.image, 'tree');
  }
  for (const uni of country.universities ?? []) {
    for (const c of uni.colleges ?? []) {
      if (c.slug) add(c.slug, c.image, 'tree');
    }
  }
}

writeFileSync(
  OUT,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      count: Object.keys(index).length,
      bySlug: index,
    },
    null,
    2
  )
);

console.log(`Wrote ${Object.keys(index).length} college images → ${OUT}`);
