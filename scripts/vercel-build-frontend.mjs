/**
 * Run `next build` for apps/frontend from the monorepo root (npm run vercel-build).
 * For Vercel: set project Root Directory to apps/frontend — there is no root vercel.json.
 * Use this script locally or in custom CI when cwd is the repo root.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = path.join(repoRoot, 'apps', 'frontend');

const result = spawnSync('npm', ['run', 'build'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status === null ? 1 : result.status);
