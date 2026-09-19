/**
 * Import local seed JSON (346 posts + 358 pages) into Hostinger Strapi.
 * Does NOT change frontend code. Live MySQL BlogPost rows are only touched if
 * Hostinger Strapi has STRAPI_ALLOW_LIVE_SYNC=1 (prefer turn OFF during bulk import).
 *
 * 1) Strapi Admin → Settings → API Tokens → Create (Full access) → copy token
 * 2) PowerShell:
 *      $env:STRAPI_URL = "https://mintcream-echidna-747154.hostingersite.com"
 *      $env:STRAPI_TOKEN = "paste-token"
 *      $env:STRAPI_ALLOW_REMOTE_IMPORT = "1"
 *      node scripts/strapi-import-seed-to-strapi.mjs
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = (process.env.STRAPI_URL || 'https://mintcream-echidna-747154.hostingersite.com').replace(
  /\/$/,
  ''
);

if (!process.env.STRAPI_TOKEN) {
  console.error('Missing STRAPI_TOKEN. Create Full access token in Strapi Admin → Settings → API Tokens.');
  process.exit(1);
}

process.env.STRAPI_URL = url;
process.env.STRAPI_ALLOW_REMOTE_IMPORT = '1';

console.log('[hostinger-seed] importing into', url);
console.log(
  '[hostinger-seed] Tip: set STRAPI_ALLOW_LIVE_SYNC=0 on Hostinger during import to avoid 700 live syncs, then set back to 1.'
);

const child = spawn(process.execPath, [path.join(root, 'scripts/strapi-import-seed-to-strapi.mjs')], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code || 0));
