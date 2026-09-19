/**
 * Hostinger-only entry (panel Start / Entry file: server.js).
 * Amplify does NOT use this file.
 *
 * Hostinger's supervisor requires THIS process to call http.Server#listen()
 * within ~3 seconds. Spawning Next (or requiring a file that only starts when
 * require.main === module) leaves the parent without listen() → 504 + restart loop.
 *
 * Strategy: listen immediately, then attach the Next request handler in-process.
 * Fast path: serve public/ + /.next/static from disk (bypass Next) and cache HTML.
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

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

const HTML_TTL_MS = Math.max(5_000, parseInt(process.env.HTML_CACHE_TTL_MS || '120000', 10) || 120_000);
const HTML_CACHE_MAX = Math.max(10, parseInt(process.env.HTML_CACHE_MAX || '80', 10) || 80);
const htmlCache = new Map();

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

let appDirReady = null;

function safeDecode(p) {
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
}

function underRoot(rootDir, filePath) {
  const rootResolved = path.resolve(rootDir);
  const resolved = path.resolve(filePath);
  const prefix = rootResolved.endsWith(path.sep) ? rootResolved : rootResolved + path.sep;
  return resolved === rootResolved || resolved.startsWith(prefix);
}

function cacheControlFor(filePath) {
  const base = path.basename(filePath).toLowerCase();
  if (base === 'sw.js') return 'no-cache, no-store, must-revalidate';
  if (filePath.includes(`${path.sep}_next${path.sep}static${path.sep}`)) {
    return 'public, max-age=31536000, immutable';
  }
  const ext = path.extname(filePath).toLowerCase();
  if (
    ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.avif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.otf'].includes(
      ext
    )
  ) {
    return 'public, max-age=31536000, immutable';
  }
  if (['.js', '.css', '.mjs'].includes(ext)) {
    return 'public, max-age=86400, stale-while-revalidate=604800';
  }
  return 'public, max-age=3600, stale-while-revalidate=86400';
}

function sendFile(req, res, filePath) {
  let st;
  try {
    st = fs.statSync(filePath);
  } catch {
    return false;
  }
  if (!st.isFile()) return false;

  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const headers = {
    'Content-Type': type,
    'Content-Length': st.size,
    'Cache-Control': cacheControlFor(filePath),
    'Last-Modified': st.mtime.toUTCString(),
    'X-AR-Static': '1',
  };

  if (req.method === 'HEAD') {
    res.writeHead(200, headers);
    res.end();
    return true;
  }

  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function tryServeStatic(req, res) {
  if (!appDirReady) return false;
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;

  const { pathname: rawPath } = parse(req.url || '/', true);
  const pathname = safeDecode(rawPath || '/');
  if (!pathname || pathname === '/' || pathname.includes('\0') || pathname.includes('..')) {
    return false;
  }
  if (pathname.startsWith('/api/')) return false;

  let filePath = null;
  if (pathname.startsWith('/_next/static/')) {
    const rel = pathname.slice('/_next/static/'.length);
    filePath = path.join(appDirReady, '.next', 'static', rel);
    if (!underRoot(path.join(appDirReady, '.next', 'static'), filePath)) return false;
  } else {
    filePath = path.join(appDirReady, 'public', pathname);
    if (!underRoot(path.join(appDirReady, 'public'), filePath)) return false;
  }

  return sendFile(req, res, filePath);
}

function normalizeHtmlKey(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function shouldCacheHtml(pathname, method) {
  if (method !== 'GET') return false;
  if (!pathname) return false;
  if (pathname.startsWith('/api/')) return false;
  if (pathname.startsWith('/_next/')) return false;
  if (pathname.includes('.')) return false;
  return true;
}

function rememberHtml(key, statusCode, headers, body) {
  if (statusCode !== 200 || !body || !body.length) return;
  if (htmlCache.size >= HTML_CACHE_MAX) {
    const oldest = htmlCache.keys().next().value;
    if (oldest !== undefined) htmlCache.delete(oldest);
  }
  const outHeaders = { ...headers };
  outHeaders['Cache-Control'] =
    outHeaders['Cache-Control'] || 'public, s-maxage=120, stale-while-revalidate=600';
  outHeaders['X-AR-Html-Cache'] = 'STORE';
  outHeaders['Content-Length'] = Buffer.byteLength(body);
  htmlCache.set(key, {
    expires: Date.now() + HTML_TTL_MS,
    statusCode,
    headers: outHeaders,
    body,
  });
}

function tryServeHtmlCache(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const { pathname: rawPath } = parse(req.url || '/', true);
  const key = normalizeHtmlKey(safeDecode(rawPath || '/'));
  if (!shouldCacheHtml(key, 'GET')) return false;
  const hit = htmlCache.get(key);
  if (!hit || hit.expires <= Date.now()) {
    if (hit) htmlCache.delete(key);
    return false;
  }
  const headers = { ...hit.headers, 'X-AR-Html-Cache': 'HIT' };
  if (req.method === 'HEAD') {
    res.writeHead(hit.statusCode, headers);
    res.end();
    return true;
  }
  res.writeHead(hit.statusCode, headers);
  res.end(hit.body);
  return true;
}

function wrapHtmlCache(handle) {
  return (req, res) => {
    if (tryServeStatic(req, res)) return;
    if (tryServeHtmlCache(req, res)) return;

    const { pathname: rawPath } = parse(req.url || '/', true);
    const key = normalizeHtmlKey(safeDecode(rawPath || '/'));
    const cacheable = shouldCacheHtml(key, req.method || 'GET');
    if (!cacheable) {
      return handle(req, res, parse(req.url || '/', true));
    }

    const chunks = [];
    let statusCode = 200;
    const headerBag = {};
    const origWriteHead = res.writeHead.bind(res);
    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);

    res.writeHead = function patchedWriteHead(code, reasonOrHeaders, maybeHeaders) {
      statusCode = typeof code === 'number' ? code : statusCode;
      let headers = maybeHeaders;
      if (typeof reasonOrHeaders === 'object' && reasonOrHeaders) headers = reasonOrHeaders;
      if (headers && typeof headers === 'object') {
        for (const [k, v] of Object.entries(headers)) {
          headerBag[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : String(v);
        }
      }
      return origWriteHead(code, reasonOrHeaders, maybeHeaders);
    };

    const origSetHeader = res.setHeader.bind(res);
    res.setHeader = function patchedSetHeader(name, value) {
      headerBag[String(name).toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
      return origSetHeader(name, value);
    };

    res.write = function patchedWrite(chunk, encoding, cb) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      return origWrite(chunk, encoding, cb);
    };

    res.end = function patchedEnd(chunk, encoding, cb) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      const body = Buffer.concat(chunks);
      const ct = headerBag['content-type'] || '';
      if (ct.includes('text/html') && statusCode === 200 && !headerBag['set-cookie']) {
        rememberHtml(
          key,
          statusCode,
          {
            'Content-Type': ct || 'text/html; charset=utf-8',
            'Cache-Control':
              headerBag['cache-control'] || 'public, s-maxage=120, stale-while-revalidate=600',
          },
          body
        );
      }
      return origEnd(chunk, encoding, cb);
    };

    return handle(req, res, parse(req.url || '/', true));
  };
}

/** Temporary handler until Next.prepare() finishes */
let requestHandler = (req, res) => {
  if (tryServeStatic(req, res)) return;
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
  appDirReady = appDir;
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
  requestHandler = wrapHtmlCache(handle);
  console.log(
    '[hostinger-server] Next.js handler ready (static disk + HTML cache TTL=' + HTML_TTL_MS + 'ms)'
  );
}

attachNext().catch((err) => {
  console.error('[hostinger-server] failed to start Next.js', err);
  process.exit(1);
});
