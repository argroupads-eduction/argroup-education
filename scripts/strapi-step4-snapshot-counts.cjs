const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function loadEnv(file) {
  const m = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    m[t.slice(0, i).trim()] = v;
  }
  return m;
}

async function main() {
  const env = loadEnv(path.join('apps/frontend/.env.local'));
  if (!env.DATABASE_URL) {
    console.log('no DATABASE_URL — skip count snapshot');
    return;
  }
  process.env.DATABASE_URL = env.DATABASE_URL;
  const prisma = new PrismaClient();
  const posts = await prisma.blogPost.count();
  const pages = await prisma.sitePage.count();
  const newest = await prisma.blogPost.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 5,
    select: { slug: true, publishedAt: true, title: true },
  });
  const out = {
    snapshotAt: new Date().toISOString(),
    posts,
    pages,
    newest,
    note: 'read-only counts before Step4 smoke',
  };
  const dir = 'backups/pre-strapi-migration-2026-09-18/manifests';
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'STEP4-PRE-CUTOVER-COUNTS.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
