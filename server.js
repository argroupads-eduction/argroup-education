/**
 * Hostinger-only entry (panel Start / Entry file: server.js).
 * Amplify does NOT use this file.
 *
 * Hostinger's supervisor requires THIS process to call http.Server#listen()
 * within ~3 seconds. Spawning Next (or requiring a file that only starts when
 * require.main === module) leaves the parent without listen() → 504 + restart loop.
 *
 * Strategy: listen immediately, then attach the Next request handler in-process.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');

const root = __dirname;
const port = parseInt(String(process.env.PORT || '3000'), 10);
const hostname = '0.0.0.0';

Object.assign(process.env, {
  PORT: String(port),
  HOSTNAME: hostname,
  HOSTINGER: '1',
  SKIP_WP_MEDIA_BUNDLE: '1',
  NODE_ENV: process.env.NODE_ENV || 'production',
});

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

/** Temporary handler until Next.prepare() finishes */
let requestHandler = (req, res) => {
  res.statusCode = 503;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Retry-After', '2');
  res.end('Starting…');
};

const server = http.createServer((req, res) => {
  try {
    requestHandler(req, res);
  } catch (err) {
    console.error('[hostinger-server] request error', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }
});

// CRITICAL: Hostinger watches THIS process — bind before loading Next.
server.listen(port, hostname, () => {
  console.log(`[hostinger-server] listen() OK http://${hostname}:${port}`);
});

function loadNextFrom(appDir) {
  const resolved = require.resolve('next', { paths: [appDir, root] });
  return require(resolved);
}

function applyStandaloneConfig(appDir) {
  const requiredPath = path.join(appDir, '.next', 'required-server-files.json');
  if (!fs.existsSync(requiredPath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(requiredPath, 'utf8'));
    const config = parsed.config || parsed;
    process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(config);
    return config;
  } catch (err) {
    console.warn('[hostinger-server] could not read required-server-files.json', err.message);
    return null;
  }
}

async function attachNext() {
  if (!serverJs) {
    throw new Error(
      'standalone server.js not found — run npm run hostinger:build on Hostinger first'
    );
  }

  const appDir = path.dirname(serverJs);
  console.log('[hostinger-server] attaching Next from', appDir);
  process.chdir(appDir);

  const conf = applyStandaloneConfig(appDir);
  const next = loadNextFrom(appDir);
  const app = next({
    dev: false,
    dir: appDir,
    conf: conf || undefined,
  });

  await app.prepare();
  const handle = app.getRequestHandler();
  requestHandler = (req, res) => {
    const parsedUrl = parse(req.url || '/', true);
    return handle(req, res, parsedUrl);
  };
  console.log('[hostinger-server] Next.js handler ready');
}

attachNext().catch((err) => {
  console.error('[hostinger-server] failed to start Next.js', err);
  process.exit(1);
});
