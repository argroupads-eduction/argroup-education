/**
 * Merge repo-root _uploads/ into public/wp-content/uploads/
 * (keeps existing colleges/ banners and other public assets).
 *
 * Usage from repo root:
 *   node apps/frontend/scripts/setup-wp-uploads-from-folder.mjs
 *
 * Optional custom source:
 *   node apps/frontend/scripts/setup-wp-uploads-from-folder.mjs ../../_uploads
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(__dirname, '..');
const DEFAULT_SOURCE = path.resolve(FRONTEND_ROOT, '..', '..', '_uploads');
const SOURCE = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SOURCE;
const DEST = path.join(FRONTEND_ROOT, 'public', 'wp-content', 'uploads');

function countFiles(dir) {
  let n = 0;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) n += countFiles(full);
    else n += 1;
  }
  return n;
}

if (!existsSync(SOURCE)) {
  console.error(`\nMissing source folder: ${SOURCE}`);
  console.error('Place WordPress wp-content/uploads export at repo root as _uploads/\n');
  process.exit(1);
}

mkdirSync(DEST, { recursive: true });

const topLevel = readdirSync(SOURCE);
let copied = 0;

for (const name of topLevel) {
  const from = path.join(SOURCE, name);
  const to = path.join(DEST, name);
  cpSync(from, to, { recursive: true, force: true });
  copied += statSync(from).isDirectory() ? countFiles(from) : 1;
}

console.log(`\nMerged ${copied} files from:`);
console.log(`  ${SOURCE}`);
console.log(`→ ${DEST}`);
console.log(`Top-level entries: ${readdirSync(DEST).join(', ')}`);
console.log('\nRestart dev server or redeploy to serve updated images.\n');
