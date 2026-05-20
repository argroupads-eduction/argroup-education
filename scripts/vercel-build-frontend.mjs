/**
 * Vercel root-directory fallback: run Next.js build inside apps/frontend.
 * Use as root buildCommand when the project Root Directory is not yet apps/frontend.
 * Preferred: set Root Directory to apps/frontend and use apps/frontend/vercel.json (npm run build).
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
