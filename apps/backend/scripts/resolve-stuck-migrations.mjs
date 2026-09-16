/**
 * Fix Prisma P3009 (failed migration blocks db:deploy).
 *
 * Usage (from repo root):
 *   node apps/backend/scripts/resolve-stuck-migrations.mjs
 *
 * Then:
 *   npm run db:deploy
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');

const prisma = new PrismaClient();

async function tableExists(tableName) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS "exists"`,
    tableName
  );
  return Boolean(rows?.[0]?.exists);
}

async function columnExists(tableName, columnName) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
    ) AS "exists"`,
    tableName,
    columnName
  );
  return Boolean(rows?.[0]?.exists);
}

function runResolve(migrationName, flag) {
  console.log(`→ prisma migrate resolve --${flag} ${migrationName}`);
  execSync(`npx prisma migrate resolve --${flag} ${migrationName}`, {
    cwd: backendRoot,
    stdio: 'inherit',
    env: process.env,
  });
}

async function main() {
  const fixes = [
    {
      migration: '20260602120000_neet_rank_predictor',
      table: 'NeetRankPredictorSubmission',
    },
    {
      migration: '20260605120000_website_form_leads',
      table: 'WebsiteFormLead',
    },
  ];

  for (const { migration, table } of fixes) {
    if (await tableExists(table)) {
      try {
        runResolve(migration, 'applied');
        console.log(`✓ Marked ${migration} as applied (${table} exists)\n`);
      } catch (err) {
        console.warn(`! Could not resolve ${migration}:`, err.message || err);
      }
    }
  }

  if (await tableExists('WebsiteFormLead')) {
    const hasEmailKey = await columnExists('WebsiteFormLead', 'emailKey');
    if (!hasEmailKey) {
      console.log('→ Applying lead dedup columns manually…');
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "WebsiteFormLead" ADD COLUMN IF NOT EXISTS "emailKey" TEXT`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "WebsiteFormLead" ADD COLUMN IF NOT EXISTS "phoneKey" TEXT`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "WebsiteFormLead_emailKey_phoneKey_idx" ON "WebsiteFormLead"("emailKey", "phoneKey")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "WebsiteFormLead_emailKey_phoneKey_unique"
         ON "WebsiteFormLead"("emailKey", "phoneKey")
         WHERE "emailKey" IS NOT NULL AND "phoneKey" IS NOT NULL`
      );
      try {
        runResolve('20260615120000_lead_dedup_keys', 'applied');
        console.log('✓ Lead dedup migration marked applied\n');
      } catch {
        /* migration row may not exist yet */
      }
    }
  }

  console.log('Done. Now run: npm run db:deploy');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
