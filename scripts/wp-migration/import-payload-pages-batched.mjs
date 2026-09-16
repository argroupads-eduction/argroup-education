/**
 * Import only WP pages → Payload (358 published pages in batches).
 * Usage: node scripts/wp-migration/import-payload-pages-batched.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CMS = path.join(ROOT, 'ar-group-of-eductions');
const PAGE_BATCH = 8;
const PAGE_TOTAL = 358;

function runBatch(offset, limit) {
  console.log(`\n=== pages offset=${offset} limit=${limit} @ ${new Date().toISOString()} ===`);
  const r = spawnSync(
    'npx',
    ['tsx', 'scripts/import-wp-bundle.mts', '--pages-only', `--offset=${offset}`, `--limit=${limit}`],
    {
      cwd: CMS,
      stdio: 'inherit',
      env: { ...process.env, PAYLOAD_DATABASE_PUSH: 'false' },
      shell: true,
    },
  );
  return r.status ?? 1;
}

let hadError = false;
for (let offset = 0; offset < PAGE_TOTAL; offset += PAGE_BATCH) {
  const code = runBatch(offset, PAGE_BATCH);
  if (code !== 0) hadError = true;
}

console.log('\n[pages-batched] All page batches finished.');
process.exit(hadError ? 1 : 0);
