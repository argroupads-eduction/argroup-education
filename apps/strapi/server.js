/**
 * Hostinger entry file — MUST call listen() within ~3s or proxy returns 403.
 * Pattern matches repo root marketing server.js (early listen, then attach app).
 *
 * Panel settings:
 *   Entry / Start: node server.js
 *   Build: npm run hostinger:build
 *   Output directory: (empty)
 *   Root: apps/strapi
 */
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
  console.error('[hostinger-strapi] early listen OK on 0.0.0.0:%s (Hostinger proxy ready)', port);
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

  console.error(
    '[hostinger-strapi] loading Strapi… DB=%s@%s/%s PUBLIC_URL=%s',
    process.env.DATABASE_USERNAME,
    process.env.DATABASE_HOST,
    process.env.DATABASE_NAME,
    process.env.PUBLIC_URL || '(unset)'
  );

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
    console.error('[hostinger-strapi] Strapi loaded and serving on existing HTTP server');
  }

  console.error('[hostinger-strapi] READY — open /admin');
})().catch((err) => {
  console.error('[hostinger-strapi] FATAL during Strapi load', err);
  process.exit(1);
});
