/**
 * Hostinger Node entry — ensure we bind 0.0.0.0:$PORT then start Strapi.
 * Crash early with a clear message if required env is missing (shows in Runtime logs).
 */
'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');

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

process.env.HOST = process.env.HOST || '0.0.0.0';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const port = process.env.PORT || '1337';
console.log(
  '[hostinger-strapi] starting HOST=%s PORT=%s PUBLIC_URL=%s DB=%s@%s/%s',
  process.env.HOST,
  port,
  process.env.PUBLIC_URL || '(unset)',
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_HOST,
  process.env.DATABASE_NAME
);

const strapiBin = path.join(__dirname, 'node_modules', '@strapi', 'strapi', 'bin', 'strapi.js');
const child = spawn(process.execPath, [strapiBin, 'start'], {
  cwd: __dirname,
  env: process.env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  console.error('[hostinger-strapi] strapi exited code=%s signal=%s', code, signal);
  process.exit(code || 1);
});
