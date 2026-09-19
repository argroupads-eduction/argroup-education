/**
 * Hostinger Node entry — bind 0.0.0.0:$PORT, sanitize APP_KEYS, start Strapi.
 */
'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

console.error('[hostinger-strapi] boot pid=%s cwd=%s', process.pid, __dirname);

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
  console.error('[hostinger-strapi] DATABASE_CLIENT must be mysql on Hostinger');
  process.exit(1);
}

// Hostinger UI / copy-paste often inserts spaces into APP_KEYS — Strapi then crashes.
process.env.APP_KEYS = String(process.env.APP_KEYS)
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean)
  .join(',');

process.env.HOST = '0.0.0.0';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const port = process.env.PORT || '1337';
console.error(
  '[hostinger-strapi] starting HOST=%s PORT=%s PUBLIC_URL=%s DB=%s@%s/%s keys=%s',
  process.env.HOST,
  port,
  process.env.PUBLIC_URL || '(unset)',
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_HOST,
  process.env.DATABASE_NAME,
  process.env.APP_KEYS.split(',').length
);

const strapiBin = path.join(__dirname, 'node_modules', '@strapi', 'strapi', 'bin', 'strapi.js');
if (!fs.existsSync(strapiBin)) {
  console.error('[hostinger-strapi] Strapi binary missing:', strapiBin);
  console.error('[hostinger-strapi] Did build finish? Is root directory apps/strapi?');
  process.exit(1);
}

const child = spawn(process.execPath, [strapiBin, 'start'], {
  cwd: __dirname,
  env: process.env,
  stdio: 'inherit',
});

child.on('error', (err) => {
  console.error('[hostinger-strapi] spawn error', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  console.error('[hostinger-strapi] strapi exited code=%s signal=%s', code, signal);
  process.exit(code || 1);
});
