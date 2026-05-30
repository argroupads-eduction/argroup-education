import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const REQUIRED = [
  'ar-group-logo.png',
  'india-homepage.jpg',
  'abroad-homepage.jpg',
  'about-counsellor.png',
];

const missing = REQUIRED.filter((file) => !existsSync(join(publicDir, file)));

if (missing.length > 0) {
  console.error('[verify-public-assets] Missing files in apps/frontend/public/:');
  missing.forEach((file) => console.error(`  - ${file}`));
  console.error('Ensure assets are committed (git ls-files apps/frontend/public).');
  process.exit(1);
}

console.log('[verify-public-assets] OK:', REQUIRED.join(', '));
