import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { isPrismaConnectionError, neonDatabaseUrl } from './neonDatabaseUrl';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Placeholder for `next build` / CI when routes are imported but no DB is reachable. */
const BUILD_TIME_DATABASE_URL =
  'postgresql://build:build@127.0.0.1:5432/build?schema=public';

function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (raw) return neonDatabaseUrl(raw);

  const isCompileOnly =
    process.env.CI === 'true' ||
    process.env.npm_lifecycle_event === 'build' ||
    process.env.NEXT_PHASE === 'phase-production-build';

  if (isCompileOnly) return BUILD_TIME_DATABASE_URL;

  throw new Error(
    'DATABASE_URL is missing. Copy apps/backend/.env.example to .env and set Neon credentials.'
  );
}

function createPrismaClient(): PrismaClient {
  const url = resolveDatabaseUrl();
  return new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;

let connecting: Promise<void> | null = null;

/** Call once at server start; safe to call again after Neon idle disconnect. */
export async function connectPrisma(): Promise<void> {
  if (!connecting) {
    connecting = prisma.$connect().finally(() => {
      connecting = null;
    });
  }
  await connecting;
}

/** Drop stale pool connections (Neon pooler / ts-node-dev hot reload). */
export async function reconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }
  await connectPrisma();
}

export async function withPrismaRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!isPrismaConnectionError(err)) throw err;
    if (process.env.NODE_ENV === 'development') {
      console.warn('[prisma] connection lost — reconnecting…');
    }
    await reconnectPrisma();
    return fn();
  }
}
