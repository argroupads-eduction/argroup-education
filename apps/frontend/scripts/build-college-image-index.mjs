/**
 * Build slug → local/API image path index from WP export, program trees, and uploads scan.
 *
 *   node apps/frontend/scripts/build-college-image-index.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractFirstContentImage } from '../../../scripts/lib/college-slug-match.mjs';
import {
  isJunkCollegeImage,
  pickCollegePageImage,
  scoreCollegeImage,
  slugFilenameTokens,
} from '../../../scripts/lib/college-image-quality.mjs';

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

function elementorThumbToUploadsRel(filename) {
  const match = filename.match(/^(.+)-[a-z0-9]{16,}\.(jpe?g|png|webp|gif|avif)$/i);
  if (!match) return null;
  const baseFile = `${match[1]}.${match[2].toLowerCase()}`;
  const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020'];
  for (const year of years) {
    for (const month of ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']) {
      const rel = `${year}/${month}/${baseFile}`;
      if (existsSync(path.join(UPLOADS, rel))) return rel;
    }
  }
  return `2024/01/${baseFile}`;
}

function resolveExactWpUrl(url) {
  const rel = wpRelFromUrl(url);
  if (!rel) return null;
  const direct = path.join(UPLOADS, rel);
  if (existsSync(direct)) return toPublicCollegesPath(rel);

  const basename = path.basename(rel);
  const hit = allFiles.find((f) => path.basename(f).toLowerCase() === basename.toLowerCase());
  if (hit) return toPublicCollegesPath(relFromUploads(hit));

  const fromThumb = resolveElementorThumb(basename);
  if (fromThumb) return fromThumb;

  if (rel.includes('elementor/thumbs/')) {
    const guessed = elementorThumbToUploadsRel(basename);
    if (guessed) return toApiPath(guessed);
  }

  return null;
}

function resolveElementorThumb(filename) {
  const match = filename.match(/^(.+)-[a-z0-9]{16,}\.(jpe?g|png|webp|gif|avif)$/i);
  if (!match) return null;
  const prefix = match[1].toLowerCase();
  if (/^untitled(?:-\d+)?$/i.test(prefix)) return null;
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
  const tokens = slugFilenameTokens(slug);
  if (tokens.length < 2) return null;

  let best = null;
  let bestScore = 0;
  for (const f of allFiles) {
    const name = path.basename(f).toLowerCase();
    const score = tokens.reduce((n, t) => (name.includes(t) ? n + 1 : n), 0);
    if (score > bestScore && score >= Math.min(3, tokens.length)) {
      best = f;
      bestScore = score;
    }
  }
  return best ? toApiPath(relFromUploads(best)) : null;
}

function pickBest(slug, contentHtml, ...urls) {
  const pagePick = pickCollegePageImage(slug, urls.find(Boolean) ?? null, contentHtml);
  if (pagePick) {
    const exact = resolveExactWpUrl(pagePick);
    if (exact && !isJunkCollegeImage(exact, slug)) return exact;
  }

  for (const url of urls) {
    if (!url) continue;
    const exact = resolveExactWpUrl(url);
    if (exact && !isJunkCollegeImage(exact, slug) && scoreCollegeImage(exact, slug) >= 3) return exact;
  }

  const bySlug = resolveBySlug(slug);
  if (bySlug && !isJunkCollegeImage(bySlug, slug) && scoreCollegeImage(bySlug, slug) >= 4) return bySlug;
  return null;
}

const index = {};

function add(slug, url, source, contentHtml) {
  if (!slug) return;
  const image = url || extractFirstContentImage(contentHtml);
  const resolved = pickBest(slug, contentHtml, image);
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
    add(row.slug, image, 'featured', row.content);
  }
}

const india = JSON.parse(readFileSync(path.join(ROOT, 'data/mbbs-india-tree.json'), 'utf8'));
for (const state of india.states) {
  for (const c of state.colleges) {
    if (c.slug) add(c.slug, c.image, 'tree', null);
  }
}

const abroad = JSON.parse(readFileSync(path.join(ROOT, 'data/mbbs-abroad-tree.json'), 'utf8'));
for (const country of abroad.countries) {
  for (const c of country.colleges ?? []) {
    if (c.slug) add(c.slug, c.image, 'tree', null);
  }
  for (const uni of country.universities ?? []) {
    for (const c of uni.colleges ?? []) {
      if (c.slug) add(c.slug, c.image, 'tree', null);
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

// Prefer bundled colleges/ photos over remote API paths
import { spawnSync } from 'node:child_process';
spawnSync(process.execPath, [path.join(__dirname, 'sync-colleges-index.mjs')], {
  stdio: 'inherit',
});
