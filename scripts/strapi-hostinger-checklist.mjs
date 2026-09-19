/**
 * Print Hostinger Strapi cutover checklist (no secrets, no network).
 * Full steps: docs/STRAPI_HOSTINGER.md
 */
const steps = [
  '1. hPanel → MySQL: create NEW empty DB (e.g. uXXXX_strapi) — NOT the BlogPost DB',
  '2. hPanel → new Node website → Root: apps/strapi',
  '3. Build: npm run hostinger:build | Start: npm run hostinger:start | Output: empty',
  '4. Paste env from apps/strapi/.env.hostinger.example (fill secrets + PUBLIC_URL)',
  '5. Deploy → open /admin → create admin → API token',
  '6. Import seed: STRAPI_URL=https://cms… STRAPI_ALLOW_REMOTE_IMPORT=1 node scripts/strapi-import-seed-to-strapi.mjs',
  '7. Smoke publish one post → confirm www updates; Media Library upload → /uploads URL works',
];

console.log('Strapi Hostinger checklist\n');
for (const s of steps) console.log(s);
console.log('\nDetails: docs/STRAPI_HOSTINGER.md');
