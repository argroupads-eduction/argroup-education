/**
 * Run WP→Payload import in small batches (fresh DB connection each batch).
 * Usage: node scripts/wp-migration/import-payload-batched.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CMS = path.join(ROOT, 'ar-group-of-eductions');
const POST_BATCH = 10;
const PAGE_BATCH = 8;

function runBatch(type, offset, limit) {
  const flag = type === 'posts' ? '--posts-only' : '--pages-only';
  console.log(`\n=== ${type} offset=${offset} limit=${limit} @ ${new Date().toISOString()} ===`);
  const r = spawnSync(
    'npx',
    ['tsx', 'scripts/import-wp-bundle.mts', flag, `--offset=${offset}`, `--limit=${limit}`],
    {
      cwd: CMS,
      stdio: 'inherit',
      env: { ...process.env, PAYLOAD_DATABASE_PUSH: 'false' },
      shell: true,
    }
  );
  return r.status ?? 1;
}

let hadError = false;

for (let offset = 0; offset < 269; offset += POST_BATCH) {
  const code = runBatch('posts', offset, POST_BATCH);
  if (code !== 0) hadError = true;
}

for (let offset = 0; offset < 358; offset += PAGE_BATCH) {
  const code = runBatch('pages', offset, PAGE_BATCH);
  if (code !== 0) hadError = true;
}

console.log('\n[batched-import] All batches finished.');
process.exit(hadError ? 1 : 0);
