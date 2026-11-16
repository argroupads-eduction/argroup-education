/**
 * Import WP featured images in batches.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CMS = path.join(ROOT, 'ar-group-of-eductions');
const BATCH = 20;

function runBatch(offset) {
  console.log(`\n=== media offset=${offset} limit=${BATCH} ===`);
  const r = spawnSync(
    'npx',
    ['tsx', 'scripts/import-wp-media.mts', `--offset=${offset}`, `--limit=${BATCH}`],
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
for (let offset = 0; offset < 650; offset += BATCH) {
  const code = runBatch(offset);
  if (code !== 0) hadError = true;
}

console.log('\n[media-batched] Done.');
process.exit(hadError ? 1 : 0);
