/**
 * Import data/hostinger-marketing-db-export.json into Hostinger MySQL.
 *
 *   DATABASE_URL="mysql://..." node apps/backend/scripts/migrate-to-hostinger-mysql.mjs import
 *
 * Create dump first:
 *   node apps/backend/scripts/export-marketing-from-live-api.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dumpPath = path.resolve(
  __dirname,
  '../../../data/hostinger-marketing-db-export.json'
);

function asJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return value;
}

function normalizeRow(table, row) {
  const next = { ...row };
  if (table === 'blogPost' || table === 'sitePage') {
    next.tags = asJsonArray(next.tags);
    next.keywords = asJsonArray(next.keywords);
  }
  if (table === 'country') next.benefits = asJsonArray(next.benefits);
  if (table === 'university') next.affiliations = asJsonArray(next.affiliations);
  if (table === 'websiteFormLead' && (next.fields == null || typeof next.fields !== 'object')) {
    next.fields = {};
  }
  if (table === 'siteGlobal' && (next.data == null || typeof next.data !== 'object')) {
    next.data = {};
  }
  if (typeof next.publishedAt === 'string') next.publishedAt = new Date(next.publishedAt);
  if (typeof next.createdAt === 'string') next.createdAt = new Date(next.createdAt);
  if (typeof next.updatedAt === 'string') next.updatedAt = new Date(next.updatedAt);
  if (typeof next.subscribedAt === 'string') next.subscribedAt = new Date(next.subscribedAt);
  if (typeof next.unsubscribedAt === 'string') next.unsubscribedAt = new Date(next.unsubscribedAt);
  if (typeof next.lastLogin === 'string') next.lastLogin = new Date(next.lastLogin);
  return next;
}

async function upsertRow(prisma, table, data) {
  if (table === 'blogPost') {
    await prisma.blogPost.upsert({
      where: { slug: data.slug },
      create: data,
      update: data,
    });
    return;
  }
  if (table === 'sitePage') {
    await prisma.sitePage.upsert({
      where: { slug: data.slug },
      create: data,
      update: { ...data, wpId: undefined },
    });
    return;
  }
  if (table === 'siteGlobal') {
    await prisma.siteGlobal.upsert({
      where: { slug: data.slug },
      create: data,
      update: data,
    });
    return;
  }
  if (table === 'subscriber') {
    await prisma.subscriber.upsert({
      where: { email: data.email },
      create: data,
      update: data,
    });
    return;
  }
  if (table === 'adminUser') {
    await prisma.adminUser.upsert({
      where: { email: data.email },
      create: data,
      update: data,
    });
    return;
  }
  if (table === 'pushSubscription') {
    await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: data,
      update: data,
    });
    return;
  }
  if (table === 'country') {
    await prisma.country.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
    return;
  }
  if (table === 'university') {
    await prisma.university.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
    return;
  }

  // id-primary tables
  try {
    await prisma[table].upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  } catch {
    await prisma[table].create({ data });
  }
}

async function importDb() {
  const targetUrl = process.env.DATABASE_URL?.trim();
  if (!targetUrl || !/^mysql:\/\//i.test(targetUrl)) {
    console.error('Set DATABASE_URL to Hostinger MySQL (mysql://USER:PASS@HOST:3306/DB)');
    process.exit(1);
  }
  if (!fs.existsSync(dumpPath)) {
    console.error('Missing dump:', dumpPath);
    console.error('Run: node apps/backend/scripts/export-marketing-from-live-api.mjs');
    process.exit(1);
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
  const prisma = new PrismaClient({
    datasources: { db: { url: targetUrl } },
  });

  const order = [
    'country',
    'university',
    'blogPost',
    'sitePage',
    'neetRankPredictorSubmission',
    'websiteFormLead',
    'lead',
    'subscriber',
    'contactSubmission',
    'testimonial',
    'galleryImage',
    'adminUser',
    'siteGlobal',
    'pushSubscription',
  ];

  try {
    for (const table of order) {
      const rows = dump.tables?.[table];
      if (!Array.isArray(rows) || !rows.length) {
        console.log(table, 'skip (empty)');
        continue;
      }
      let ok = 0;
      for (const raw of rows) {
        const data = normalizeRow(table, raw);
        if (table === 'sitePage') {
          // wpId required unique — keep from dump
          delete data.wpId;
          data.wpId = raw.wpId;
        }
        try {
          if (table === 'sitePage') {
            const existing = await prisma.sitePage.findUnique({ where: { slug: data.slug } });
            if (existing) {
              const { wpId: _w, ...rest } = data;
              await prisma.sitePage.update({ where: { slug: data.slug }, data: rest });
            } else {
              await prisma.sitePage.create({ data });
            }
          } else {
            await upsertRow(prisma, table, data);
          }
          ok += 1;
        } catch (err) {
          console.warn(table, data.slug || data.id, String(err.message || err).slice(0, 160));
        }
      }
      console.log(table, `imported ${ok}/${rows.length}`);
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('Import done. Blog bodies + featuredImage URLs preserved.');
}

const cmd = process.argv[2] || 'import';
if (cmd === 'import') await importDb();
else {
  console.log('Usage: DATABASE_URL=mysql://... node apps/backend/scripts/migrate-to-hostinger-mysql.mjs import');
  process.exit(1);
}
