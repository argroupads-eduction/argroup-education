/**
 * Fill REPLACE_ME_* in .env.hostinger.import from local secrets (does not print them).
 *
 * Usage (PowerShell):
 *   $env:STRAPI_DB_PASSWORD = "your-new-strapi-db-password"
 *   node scripts/fill-strapi-hostinger-env-import.mjs
 *
 * Reads PAYLOAD_SYNC_SECRET / REVALIDATE_SECRET from apps/frontend/.env.local or .env.hostinger
 * Writes: apps/strapi/.env.hostinger.import (ready to upload in hPanel)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'apps/strapi/.env.hostinger.import');

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const map = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    map[t.slice(0, i).trim()] = v;
  }
  return map;
}

const local = {
  ...readEnvFile(path.join(root, 'apps/frontend/.env.hostinger')),
  ...readEnvFile(path.join(root, 'apps/frontend/.env.local')),
};

const sync =
  process.env.PAYLOAD_SYNC_SECRET ||
  local.PAYLOAD_SYNC_SECRET ||
  local.REVALIDATE_SECRET ||
  '';

const dbPass = process.env.STRAPI_DB_PASSWORD || '';

let text = fs.readFileSync(target, 'utf8');
if (dbPass) {
  text = text.replace(/DATABASE_PASSWORD=.*/, `DATABASE_PASSWORD=${dbPass}`);
}
if (sync) {
  text = text.replace(/PAYLOAD_SYNC_SECRET=.*/, `PAYLOAD_SYNC_SECRET=${sync}`);
}
fs.writeFileSync(target, text);

const stillDb = text.includes('REPLACE_ME_STRAPI_DB_PASSWORD');
const stillSync = text.includes('REPLACE_ME_MARKETING_PAYLOAD_SYNC_SECRET');
console.log('Wrote', target);
console.log('DATABASE_PASSWORD filled:', !stillDb);
console.log('PAYLOAD_SYNC_SECRET filled:', !stillSync);
if (stillDb) console.log('Set $env:STRAPI_DB_PASSWORD then re-run, or edit file manually.');
if (stillSync) console.log('Put PAYLOAD_SYNC_SECRET in apps/frontend/.env.local or set env, then re-run.');
