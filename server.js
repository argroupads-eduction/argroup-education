/**
 * Hostinger entrypoint (panel Start command: node server.js)
 * Forces bind 0.0.0.0 — Hostinger's HOSTNAME causes 503 if left alone.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = String(process.env.PORT || '3000');
const env = {
  ...process.env,
  PORT: port,
  HOSTNAME: '0.0.0.0',
  HOSTINGER: '1',
  SKIP_WP_MEDIA_BUNDLE: '1',
};

function findServer(dir, depth = 0) {
  if (depth > 8 || !fs.existsSync(dir)) return null;
  const direct = path.join(dir, 'server.js');
  if (fs.existsSync(direct)) return direct;
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return null;
  }
  for (const name of entries) {
    if (name === 'node_modules') continue;
    const full = path.join(dir, name);
    try {
      if (fs.statSync(full).isDirectory()) {
        const hit = findServer(full, depth + 1);
        if (hit) return hit;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

const candidates = [
  path.join(root, 'apps', 'frontend', '.next', 'standalone'),
  path.join(root, '.next', 'standalone'),
  path.join(process.cwd(), 'apps', 'frontend', '.next', 'standalone'),
  path.join(process.cwd(), 'standalone'),
];

let serverJs = null;
for (const c of candidates) {
  serverJs = findServer(c);
  if (serverJs) break;
}

function run(cmd, args, cwd) {
  console.log('[hostinger-server]', cmd, args.join(' '), 'cwd=' + cwd, 'PORT=' + port);
  const child = spawn(cmd, args, { cwd, stdio: 'inherit', env, shell: true });
  child.on('exit', (code, signal) => {
    if (signal) process.exit(1);
    process.exit(code || 0);
  });
}

if (serverJs) {
  const serverCwd = path.dirname(serverJs);
  console.log('[hostinger-server] requiring', serverJs, 'cwd=' + serverCwd, 'PORT=' + port);
  process.chdir(serverCwd);
  Object.assign(process.env, env);
  require(serverJs);
} else {
  console.warn('[hostinger-server] no standalone server.js — falling back to next start');
  const frontend = path.join(root, 'apps', 'frontend');
  run('npx', ['next', 'start', '-H', '0.0.0.0', '-p', port], frontend);
}
