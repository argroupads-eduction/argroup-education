/**
 * Stage only wp-media files listed in data/wp-media-manifest.json (not full uploads/).
 * Run after: node scripts/bundle-referenced-wp-media.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, '..');
const REPO = path.resolve(FRONTEND, '..', '..');
const MANIFEST = path.join(FRONTEND, 'data', 'wp-media-manifest.json');

if (!existsSync(MANIFEST)) {
  console.error('Run: node scripts/bundle-referenced-wp-media.mjs first');
  process.exit(1);
}

const { paths } = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const toAdd = [];

for (const rel of paths) {
  const clean = rel.replace(/\/+$/, '');
  const file = path.join(FRONTEND, 'public', 'wp-content', 'uploads', clean);
  if (existsSync(file)) {
    toAdd.push(path.relative(REPO, file).replace(/\\/g, '/'));
  }
}

if (!toAdd.length) {
  console.error('No bundled media files found under public/wp-content/uploads');
  process.exit(1);
}

const batch = 80;
for (let i = 0; i < toAdd.length; i += batch) {
  const chunk = toAdd.slice(i, i + batch);
  execSync(`git -c core.longpaths=true add ${chunk.map((p) => `"${p}"`).join(' ')}`, {
    cwd: REPO,
    stdio: 'inherit',
    shell: true,
  });
}

console.log(`\nStaged ${toAdd.length} media files for deploy.`);
