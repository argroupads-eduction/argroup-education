/**
 * Hostinger production build — standalone Next.js output + static/public copy.
 * Panel: Build command = npm run hostinger:build
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = path.join(repoRoot, 'apps', 'frontend');

const env = {
  ...process.env,
  HOSTINGER: '1',
  SKIP_WP_MEDIA_BUNDLE: '1',
};

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
    env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function findStandaloneServer(dir, depth = 0) {
  if (depth > 6 || !existsSync(dir)) return null;
  const direct = path.join(dir, 'server.js');
  if (existsSync(direct)) return direct;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    try {
      if (statSync(full).isDirectory()) {
        const hit = findStandaloneServer(full, depth + 1);
        if (hit) return hit;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

console.log('[hostinger-build] HOSTINGER=1 → next output: standalone');
run('npm', ['run', 'build:frontend']);

const standaloneRoot = path.join(frontendDir, '.next', 'standalone');
if (!existsSync(standaloneRoot)) {
  console.error('[hostinger-build] Missing apps/frontend/.next/standalone after build');
  process.exit(1);
}

const serverJs = findStandaloneServer(standaloneRoot);
if (!serverJs) {
  console.error('[hostinger-build] server.js not found under .next/standalone');
  process.exit(1);
}

const serverDir = path.dirname(serverJs);
const staticSrc = path.join(frontendDir, '.next', 'static');
const staticDest = path.join(serverDir, '.next', 'static');
const publicSrc = path.join(frontendDir, 'public');
const publicDest = path.join(serverDir, 'public');

if (existsSync(staticSrc)) {
  mkdirSync(path.dirname(staticDest), { recursive: true });
  cpSync(staticSrc, staticDest, { recursive: true });
  console.log('[hostinger-build] copied .next/static → standalone');
}

if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true });
  console.log('[hostinger-build] copied public → standalone');
}

console.log('[hostinger-build] ready:', path.relative(repoRoot, serverJs));
