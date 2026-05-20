/**
 * When Vercel Root Directory is empty (repo root), copy apps/frontend/public and
 * .next to the repo root so the platform can find static assets and Next output.
 * No-op when VERCEL_SKIP_ROOT_SYNC=1 (Root Directory = apps/frontend).
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = path.join(repoRoot, 'apps', 'frontend');

if (process.env.VERCEL_SKIP_ROOT_SYNC === '1') {
  console.log('[sync-vercel-monorepo-output] Skipped (VERCEL_SKIP_ROOT_SYNC=1)');
  process.exit(0);
}

function copyDir(src, dest) {
  if (!existsSync(src)) {
    console.error(`[sync-vercel-monorepo-output] Missing: ${src}`);
    process.exit(1);
  }
  if (existsSync(dest)) {
    rmSync(dest, { recursive: true, force: true });
  }
  mkdirSync(path.dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
}

const publicSrc = path.join(frontendDir, 'public');
const publicDest = path.join(repoRoot, 'public');
const nextSrc = path.join(frontendDir, '.next');
const nextDest = path.join(repoRoot, '.next');

copyDir(publicSrc, publicDest);
if (existsSync(nextSrc)) {
  copyDir(nextSrc, nextDest);
}

console.log('[sync-vercel-monorepo-output] Synced public/ and .next/ to repo root');
