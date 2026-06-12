/**
 * Copy only wp-content/uploads files referenced in site data into
 * public/wp-content/uploads/ for Vercel (no WP_MEDIA_ORIGIN needed).
 *
 * Sources (first hit wins): public/wp-content/uploads, repo _uploads/
 *
 *   node scripts/bundle-referenced-wp-media.mjs
 */
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(FRONTEND, '..', '..');
const DEST_ROOT = path.join(FRONTEND, 'public', 'wp-content', 'uploads');
const MANIFEST = path.join(FRONTEND, 'data', 'wp-media-manifest.json');

const DATA_FILES = [
  'data/college-image-index.json',
  'data/airport-diaries.json',
  'data/airport-diaries-images.json',
  'data/mbbs-abroad-tree.json',
  'data/mbbs-india-tree.json',
  'data/wp-export-bundle/pages.json',
  'data/wp-export-bundle/posts.json',
];

const UPLOAD_RE = /(?:wp-content\/uploads|api\/wp-media\/uploads)\/([^"'\s<>?#]+)/gi;

function collectRelativePaths() {
  const set = new Set();
  for (const rel of DATA_FILES) {
    const file = path.join(FRONTEND, rel);
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    let m;
    while ((m = UPLOAD_RE.exec(text)) !== null) {
      let p = decodeURIComponent(m[1].replace(/\\/g, '/'));
      p = p.replace(/\/+$/, '').replace(/\)+$/, '');
      if (p && !p.endsWith('/')) set.add(p);
    }
  }
  return [...set].sort();
}

function sourceRoots() {
  const roots = [
    path.join(FRONTEND, 'public', 'wp-content', 'uploads'),
    path.join(REPO_ROOT, '_uploads'),
  ];
  return roots.filter((r) => existsSync(r));
}

function resolveSource(relativePath) {
  for (const root of sourceRoots()) {
    const direct = path.join(root, relativePath);
    if (existsSync(direct)) return direct;
    const withoutUploads = relativePath.replace(/^uploads\//, '');
    const alt = path.join(root, withoutUploads);
    if (existsSync(alt)) return alt;
  }
  return null;
}

function formatBytes(n) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

const paths = collectRelativePaths();
let copied = 0;
let bytes = 0;
const missing = [];

mkdirSync(DEST_ROOT, { recursive: true });

for (const rel of paths) {
  const src = resolveSource(rel);
  const dest = path.join(DEST_ROOT, rel);
  if (!src) {
    missing.push(rel);
    continue;
  }
  if (path.resolve(src) === path.resolve(dest)) {
    copied += 1;
    bytes += statSync(dest).size;
    continue;
  }
  mkdirSync(path.dirname(dest), { recursive: true });
  cpSync(src, dest, { force: true });
  copied += 1;
  bytes += statSync(dest).size;
}

writeFileSync(
  MANIFEST,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      referenced: paths.length,
      copied,
      missing: missing.length,
      totalBytes: bytes,
      paths,
      missingPaths: missing,
    },
    null,
    2
  )
);

console.log(`Referenced: ${paths.length}`);
console.log(`Copied:     ${copied} (${formatBytes(bytes)})`);
console.log(`Missing:    ${missing.length}`);
if (missing.length) {
  console.log('\nFirst missing:');
  for (const p of missing.slice(0, 15)) console.log(`  - ${p}`);
}
console.log(`\nManifest: ${path.relative(FRONTEND, MANIFEST)}`);
