/**
 * Start Hostinger standalone Next server.
 * Panel: Start command = npm run hostinger:start
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const standaloneRoot = path.join(repoRoot, 'apps', 'frontend', '.next', 'standalone');

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

const serverJs = findStandaloneServer(standaloneRoot);
if (!serverJs) {
  console.error('[hostinger-start] Missing standalone server.js — rebuild with npm run hostinger:build');
  process.exit(1);
}

const cwd = path.dirname(serverJs);
const port = process.env.PORT || '3000';
console.log('[hostinger-start]', path.relative(repoRoot, serverJs), `PORT=${port}`);

const r = spawnSync(process.execPath, ['server.js'], {
  cwd,
  stdio: 'inherit',
  env: { ...process.env, PORT: port, HOSTNAME: process.env.HOSTNAME || '0.0.0.0' },
});
process.exit(r.status ?? 1);
