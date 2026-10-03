'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { pipeline } = require('node:stream');

/**
 * Hostinger Runtime Logs print proxy/health-check socket drops as:
 *   Connection Error: Error: read ECONNRESET
 * Those are NOT Publish failures. Swallow before anything else loads.
 */
function isBenignConnNoise(value) {
  const s =
    typeof value === 'string'
      ? value
      : value instanceof Error
        ? `${value.code || ''} ${value.message || ''}`
        : String(value ?? '');
  return /ECONNRESET|EPIPE|ERR_STREAM_DESTROYED|ECONNABORTED|ECONNREFUSED|ETIMEDOUT|Connection Error:/i.test(
    s
  );
}

const _consoleError = console.error.bind(console);
const _consoleWarn = console.warn.bind(console);
console.error = (...args) => {
  if (args.some((a) => isBenignConnNoise(a))) return;
  _consoleError(...args);
};
console.warn = (...args) => {
  if (args.some((a) => isBenignConnNoise(a))) return;
  _consoleWarn(...args);
};
try {
  const _stderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk, encoding, cb) => {
    const text = typeof chunk === 'string' ? chunk : Buffer.isBuffer(chunk) ? chunk.toString('utf8') : '';
    if (isBenignConnNoise(text)) {
      if (typeof encoding === 'function') encoding();
      else if (typeof cb === 'function') cb();
      return true;
    }
    return _stderrWrite(chunk, encoding, cb);
  };
} catch {
  /* ignore */
}

process.env.HOST = '0.0.0.0';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

if (process.env.APP_KEYS) {
  process.env.APP_KEYS = String(process.env.APP_KEYS)
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
    .join(',');
}

const port = parseInt(String(process.env.PORT || '1337'), 10);
const uploadsRoot = path.join(__dirname, 'public', 'uploads');

let ready = false;
let strapiHandler = null;

const MIME = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

/** Serve Media Library files even when Strapi static middleware is skipped by early listen. */
function tryServeUpload(req, res) {
  const rawUrl = req.url || '';
  const pathname = rawUrl.split('?')[0] || '';
  if (!pathname.startsWith('/uploads/')) return false;

  const rel = decodeURIComponent(pathname.slice('/uploads/'.length));
  if (!rel || rel.includes('..') || path.isAbsolute(rel)) {
    res.statusCode = 400;
    res.end('Bad path');
    return true;
  }

  const filePath = path.join(uploadsRoot, rel);
  if (!filePath.startsWith(uploadsRoot) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false; // fall through to Strapi
  }

  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
  pipeline(fs.createReadStream(filePath), res, (err) => {
    if (err && !res.headersSent) {
      res.statusCode = 500;
      res.end('Read error');
    }
  });
  return true;
}

function bootHandler(req, res) {
  if (tryServeUpload(req, res)) return;
  if (ready && strapiHandler) {
    return strapiHandler(req, res);
  }
  res.statusCode = 503;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Retry-After', '5');
  res.end('Strapi CMS is starting… refresh in a few seconds.');
}

const server = http.createServer((req, res) => {
  req.on('error', (err) => {
    if (isBenignConnNoise(err)) return;
  });
  res.on('error', (err) => {
    if (isBenignConnNoise(err)) return;
  });
  try {
    bootHandler(req, res);
  } catch (err) {
    if (!isBenignConnNoise(err)) {
      _consoleError('[hostinger-strapi] request error', err);
    }
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Internal error');
    }
  }
});

// Hostinger proxy idle probes — longer than default 5s helps avoid noisy resets
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = 0;

server.listen(port, '0.0.0.0', () => {
  console.log(
    '[hostinger-strapi] early listen OK on 0.0.0.0:' + port + ' (Hostinger proxy ready)'
  );
});

server.on('connection', (socket) => {
  socket.setTimeout(0);
  socket.on('error', (err) => {
    if (isBenignConnNoise(err)) return;
    _consoleError('[hostinger-strapi] socket error', err && err.message ? err.message : err);
  });
});

server.on('clientError', (err, socket) => {
  if (isBenignConnNoise(err)) {
    try {
      socket.destroy();
    } catch {
      /* ignore */
    }
    return;
  }
  _consoleError('[hostinger-strapi] clientError', err && err.message ? err.message : err);
  try {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  } catch {
    /* ignore */
  }
});

process.on('uncaughtException', (err) => {
  if (isBenignConnNoise(err)) return;
  _consoleError('[hostinger-strapi] uncaughtException', err);
});
process.on('unhandledRejection', (reason) => {
  if (isBenignConnNoise(reason)) return;
  _consoleError('[hostinger-strapi] unhandledRejection', reason);
});

server.on('error', (err) => {
  console.error('[hostinger-strapi] server error', err);
  process.exit(1);
});

(async () => {
  const required = [
    'APP_KEYS',
    'API_TOKEN_SALT',
    'ADMIN_JWT_SECRET',
    'TRANSFER_TOKEN_SALT',
  'ENCRYPTION_KEY',
  'JWT_SECRET',
  'DATABASE_CLIENT',
    'DATABASE_HOST',
    'DATABASE_NAME',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD',
  ];
  const missing = required.filter((k) => !String(process.env[k] || '').trim());
  if (missing.length) {
    console.error('[hostinger-strapi] Missing env:', missing.join(', '));
    process.exit(1);
  }
  if (String(process.env.DATABASE_CLIENT).toLowerCase() !== 'mysql') {
    console.error('[hostinger-strapi] DATABASE_CLIENT must be mysql');
    process.exit(1);
  }

  // Hostinger env UI sometimes wraps values in quotes; # in passwords also gets truncated in .env imports.
  for (const key of ['DATABASE_PASSWORD', 'DATABASE_USERNAME', 'DATABASE_NAME', 'DATABASE_HOST']) {
    let v = String(process.env[key] || '').trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    process.env[key] = v;
  }

  // Hostinger Node → MySQL on same account must use localhost.
  // Connecting via srv….hstgr.io makes MySQL see an external IPv6 client → Access denied / ECONNRESET.
  const dbHost = String(process.env.DATABASE_HOST || '');
  if (/\.hstgr\.io$/i.test(dbHost) || /^mysql\d*\./i.test(dbHost)) {
    console.log(
      '[hostinger-strapi] rewriting DATABASE_HOST from ' + dbHost + ' → localhost (same-server MySQL)'
    );
    process.env.DATABASE_HOST = 'localhost';
  }

  // Same rewrite for marketing BlogPost DB URL (Publish sync).
  const mkt = String(process.env.MARKETING_DATABASE_URL || '').trim();
  if (mkt) {
    try {
      const u = new URL(mkt);
      if (/\.hstgr\.io$/i.test(u.hostname) || /^mysql\d*\./i.test(u.hostname)) {
        u.hostname = 'localhost';
        process.env.MARKETING_DATABASE_URL = u.toString();
        console.log(
          '[hostinger-strapi] MARKETING_DATABASE_URL host → localhost (same-server marketing MySQL)'
        );
      }
    } catch (err) {
      _consoleError('[hostinger-strapi] bad MARKETING_DATABASE_URL', err && err.message);
    }
  } else {
    _consoleError(
      '[hostinger-strapi] MARKETING_DATABASE_URL MISSING — Publish will not write BlogPost'
    );
  }

  const pw = process.env.DATABASE_PASSWORD || '';
  console.log(
    '[hostinger-strapi] loading Strapi… user=' +
      process.env.DATABASE_USERNAME +
      ' host=' +
      process.env.DATABASE_HOST +
      ' db=' +
      process.env.DATABASE_NAME +
      ' passwordLength=' +
      pw.length +
      ' publicUrl=' +
      (process.env.PUBLIC_URL || '(unset)')
  );
  if (pw.length < 8) {
    console.error(
      '[hostinger-strapi] DATABASE_PASSWORD looks truncated (len=' +
        pw.length +
        '). Reset DB user password WITHOUT # or @ and update env.'
    );
  }


  const { createStrapi } = require('@strapi/strapi');
  const app = createStrapi({
    appDir: __dirname,
    distDir: path.join(__dirname, 'dist'),
  });

  await app.load();

  // listen() normally mounts routes; we skip listen() because we already own PORT
  if (typeof app.server.mount === 'function') {
    app.server.mount();
  }

  strapiHandler = app.server.app.callback();
  ready = true;

  if (typeof app.postListen === 'function') {
    await app.postListen();
  } else {
    console.log('[hostinger-strapi] Strapi loaded and serving on existing HTTP server');
  }

  console.log('[hostinger-strapi] READY — open /admin');
})().catch((err) => {
  console.error('[hostinger-strapi] FATAL during Strapi load', err);
  process.exit(1);
});
