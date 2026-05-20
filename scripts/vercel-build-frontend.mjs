/**
 * Build apps/frontend from monorepo root (npm run vercel-build).
 * Used by root vercel.json when Vercel Root Directory is empty.
 * Prefer Vercel Root Directory = apps/frontend — see docs/VERCEL_DEPLOY.md.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = path.join(repoRoot, 'apps', 'frontend');

const build = spawnSync('npm', ['run', 'build'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

if (build.status !== 0) {
  process.exit(build.status === null ? 1 : build.status);
}

const sync = spawnSync('node', ['scripts/sync-vercel-monorepo-output.mjs'], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(sync.status === null ? 1 : sync.status);
