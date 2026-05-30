import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

function neonDatabaseUrl(raw) {
  let url = raw.trim().replace(/^["']|["']$/g, '');
  if (url.includes('-pooler.') && !url.includes('pgbouncer=true')) {
    url += url.includes('?') ? '&' : '?';
    url += 'pgbouncer=true';
  }
  if (!url.includes('connect_timeout=')) {
    url += url.includes('?') ? '&' : '?';
    url += 'connect_timeout=15';
  }
  return url;
}

const url = neonDatabaseUrl(process.env.DATABASE_URL);
const prisma = new PrismaClient({ datasources: { db: { url } } });

try {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1 as ok`;
  const pages = await prisma.sitePage.count();
  console.log('[test-db] OK — site pages:', pages);
} catch (e) {
  console.error('[test-db] FAILED:', e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
