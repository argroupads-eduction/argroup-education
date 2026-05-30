import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const bundleDir = path.join(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  'data',
  'wp-export-bundle'
);

try {
  await access(path.join(bundleDir, 'pages.json'));
} catch {
  console.error(
    '[verify-wp-bundle] Missing apps/frontend/data/wp-export-bundle/pages.json\n' +
      'Run from repo root: npm run build:wp-bundle'
  );
  process.exit(1);
}

console.log('[verify-wp-bundle] OK');
