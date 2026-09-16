/**
 * Hostinger production build — always skips heavy wp-media bundling.
 * Panel: Build command = npm run hostinger:build
 * (Hostinger already runs npm install / npm ci before this.)
 */
import { spawnSync } from 'node:child_process';

const env = {
  ...process.env,
  HOSTINGER: '1',
  SKIP_WP_MEDIA_BUNDLE: '1',
};

console.log('[hostinger-build] HOSTINGER=1 SKIP_WP_MEDIA_BUNDLE=1');
const r = spawnSync('npm', ['run', 'build:frontend'], {
  stdio: 'inherit',
  shell: true,
  env,
});
process.exit(r.status ?? 1);
