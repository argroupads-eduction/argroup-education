import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skip =
  process.env.SKIP_WP_MEDIA_BUNDLE === '1' ||
  process.env.HOSTINGER === '1' ||
  process.env.HOSTINGER === 'true';

if (skip) {
  console.log('[verify-wp-bundle] SKIP (HOSTINGER/SKIP_WP_MEDIA_BUNDLE)');
  process.exit(0);
}

const bundleDir = path.join(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  'data',
  'wp-export-bundle'
);

try {
  await access(path.join(bundleDir, 'pages.json'));
} catch {
  // Slim Hostinger/main tree omits the 30MB export; site content comes from MySQL.
  console.warn(
    '[verify-wp-bundle] pages.json missing — continuing (MySQL + WP_MEDIA_ORIGIN CDN).'
  );
  process.exit(0);
}

console.log('[verify-wp-bundle] OK');
