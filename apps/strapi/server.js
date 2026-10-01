'use strict';

const http = require('node:http');
const path = require('node:path');

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

let ready = false;
let strapiHandler = null;

function bootHandler(req, res) {
  if (ready && strapiHandler) {
    return strapiHandler(req, res);
  }
  res.statusCode = 503;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Retry-After', '5');
  res.end('Strapi CMS is starting… refresh in a few seconds.');
}

const server = http.createServer((req, res) => {
  try {
    bootHandler(req, res);
  } catch (err) {
    console.error('[hostinger-strapi] request error', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Internal error');
    }
  }
});

server.listen(port, '0.0.0.0', () => {
  // Use log (not error) — Hostinger Runtime Logs counts console.error as Errors
  console.log(
    '[hostinger-strapi] early listen OK on 0.0.0.0:' + port + ' (Hostinger proxy ready)'
  );
});

// Hostinger proxy / health probes often reset idle sockets — not a real app failure
server.on('clientError', (err, socket) => {
  if (err && (err.code === 'ECONNRESET' || err.code === 'EPIPE' || err.code === 'ERR_STREAM_DESTROYED')) {
    try {
      socket.destroy();
    } catch {
      /* ignore */
    }
    return;
  }
  console.error('[hostinger-strapi] clientError', err && err.message ? err.message : err);
  try {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  } catch {
    /* ignore */
  }
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
  // Connecting via srv….hstgr.io makes MySQL see an external IPv6 client → Access denied.
  const dbHost = String(process.env.DATABASE_HOST || '');
  if (/\.hstgr\.io$/i.test(dbHost) || /^mysql\d*\./i.test(dbHost)) {
    console.log(
      '[hostinger-strapi] rewriting DATABASE_HOST from ' + dbHost + ' → localhost (same-server MySQL)'
    );
    process.env.DATABASE_HOST = 'localhost';
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
