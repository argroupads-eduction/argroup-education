/**
 * Step 4: write Strapi .env for LIVE marketing sync.
 * Reads secrets from apps/frontend/.env.local — never prints secret values.
 *
 * Usage: node scripts/strapi-enable-live-sync-env.cjs
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const localEnv = path.join(root, 'apps/frontend/.env.local');
const strapiEnv = 'D:/ar-group-strapi/.env';

function parseEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const src = parseEnv(localEnv);
const secret = src.PAYLOAD_SYNC_SECRET || src.REVALIDATE_SECRET;
if (!secret) {
  console.error('No PAYLOAD_SYNC_SECRET / REVALIDATE_SECRET in apps/frontend/.env.local');
  process.exit(1);
}

const existing = parseEnv(strapiEnv);
const next = {
  ...existing,
  HOST: existing.HOST || '0.0.0.0',
  PORT: existing.PORT || '1337',
  MARKETING_SYNC_URL: 'https://www.argroupofeducation.com',
  STRAPI_ALLOW_LIVE_SYNC: '1',
  PAYLOAD_SYNC_SECRET: secret,
  REVALIDATE_SECRET: src.REVALIDATE_SECRET || secret,
};

const lines = Object.entries(next).map(([k, v]) => `${k}=${v}`);
fs.writeFileSync(strapiEnv, lines.join('\n') + '\n', 'utf8');

console.log('Updated D:\\ar-group-strapi\\.env');
console.log('  MARKETING_SYNC_URL=https://www.argroupofeducation.com');
console.log('  STRAPI_ALLOW_LIVE_SYNC=1');
console.log('  PAYLOAD_SYNC_SECRET=<set from .env.local, not printed>');
console.log('Restart Strapi (npm run develop) for env to load.');
