/**
 * Frontend production build.
 * On Hostinger set SKIP_WP_MEDIA_BUNDLE=1 (or HOSTINGER=1) to skip the ~150MB
 * media copy step that often OOMs / kills the build with empty logs.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(frontendDir, '../backend');

const skipMedia =
  process.env.SKIP_WP_MEDIA_BUNDLE === '1' ||
  process.env.HOSTINGER === '1' ||
  process.env.HOSTINGER === 'true';

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true, env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!skipMedia) {
  console.log('[frontend-build] bundling referenced wp-media…');
  run('node', ['scripts/bundle-referenced-wp-media.mjs'], frontendDir);
} else {
  console.log('[frontend-build] SKIP_WP_MEDIA_BUNDLE/HOSTINGER — skipping media bundle');
}

console.log('[frontend-build] prisma generate…');
run('npm', ['run', 'db:generate'], backendDir);

console.log('[frontend-build] next build…');
run('npx', ['next', 'build'], frontendDir);
