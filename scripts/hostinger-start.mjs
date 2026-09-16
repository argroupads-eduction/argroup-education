/**
 * Start Hostinger standalone Next server.
 * Panel: Start command = npm run hostinger:start
 *
 * Critical: Hostinger sets HOSTNAME to the container name. Next.js binds to that
 * and the proxy gets 503. Always force 0.0.0.0.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function findStandaloneServer(dir, depth = 0) {
  if (depth > 8 || !existsSync(dir)) return null;
  const direct = path.join(dir, 'server.js');
  if (existsSync(direct)) return direct;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return null;
  }
  for (const name of entries) {
    if (name === 'node_modules') continue;
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

const candidates = [
  path.join(repoRoot, 'apps', 'frontend', '.next', 'standalone'),
  path.join(repoRoot, '.next', 'standalone'),
  path.join(process.cwd(), 'apps', 'frontend', '.next', 'standalone'),
  path.join(process.cwd(), '.next', 'standalone'),
  path.join(process.cwd(), 'standalone'),
];

let serverJs = null;
for (const root of candidates) {
  serverJs = findStandaloneServer(root);
  if (serverJs) break;
}

if (!serverJs) {
  console.error('[hostinger-start] Missing standalone server.js — rebuild with npm run hostinger:build');
  console.error('[hostinger-start] cwd=', process.cwd());
  process.exit(1);
}

const cwd = path.dirname(serverJs);
const port = String(process.env.PORT || '3000');

console.log('[hostinger-start]', serverJs);
console.log('[hostinger-start] cwd=', cwd, 'PORT=', port, 'bind=0.0.0.0');

const child = spawn(process.execPath, ['server.js'], {
  cwd,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: port,
    // Must overwrite Hostinger's container HOSTNAME or Next binds wrong → 503
    HOSTNAME: '0.0.0.0',
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error('[hostinger-start] killed by', signal);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
