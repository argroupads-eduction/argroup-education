/**
 * Extract Hostinger uploads.zip into public/wp-content/uploads/
 *
 * 1. Download wp-content/uploads as ZIP from Hostinger File Manager
 * 2. Save as apps/frontend/uploads.zip
 * 3. Run: node scripts/setup-wp-uploads-from-zip.mjs
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ZIP = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'uploads.zip');
const TMP = path.join(ROOT, '.tmp-wp-uploads-extract');
const WP_CONTENT = path.join(ROOT, 'public', 'wp-content');
const UPLOADS = path.join(WP_CONTENT, 'uploads');

function extractZip(zipPath, dest) {
  mkdirSync(dest, { recursive: true });
  if (process.platform === 'win32') {
    const ps = `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force`;
    const r = spawnSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'inherit' });
    if (r.status !== 0) process.exit(r.status ?? 1);
    return;
  }
  const r = spawnSync('unzip', ['-o', zipPath, '-d', dest], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function isYearDir(name) {
  return /^(19|20)\d{2}$/.test(name);
}

function findUploadsRoot(extractedRoot) {
  const directUploads = path.join(extractedRoot, 'uploads');
  if (existsSync(directUploads) && statSync(directUploads).isDirectory()) {
    return directUploads;
  }
  const children = readdirSync(extractedRoot);
  if (children.some(isYearDir) || children.includes('elementor')) {
    return extractedRoot;
  }
  for (const child of children) {
    const full = path.join(extractedRoot, child);
    if (!statSync(full).isDirectory()) continue;
    const nested = path.join(full, 'uploads');
    if (existsSync(nested) && statSync(nested).isDirectory()) return nested;
    const nestedChildren = readdirSync(full);
    if (nestedChildren.some(isYearDir) || nestedChildren.includes('elementor')) {
      return full;
    }
  }
  return null;
}

if (!existsSync(ZIP)) {
  console.error(`\nMissing ZIP: ${ZIP}`);
  console.error('Save Hostinger wp-content/uploads export as apps/frontend/uploads.zip\n');
  process.exit(1);
}

console.log('Extracting', ZIP);
rmSync(TMP, { recursive: true, force: true });
extractZip(ZIP, TMP);

const source = findUploadsRoot(TMP);
if (!source) {
  console.error('Could not find uploads/ or year folders inside the ZIP.');
  process.exit(1);
}

mkdirSync(WP_CONTENT, { recursive: true });
rmSync(UPLOADS, { recursive: true, force: true });
cpSync(source, UPLOADS, { recursive: true });
rmSync(TMP, { recursive: true, force: true });

const files = readdirSync(UPLOADS);
console.log(`\nDone → public/wp-content/uploads/ (${files.length} top-level entries)`);
console.log('Redeploy Vercel (or restart npm run dev) to serve college images.\n');
