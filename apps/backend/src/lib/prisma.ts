import { PrismaClient } from '@prisma/client';
import { loadMonorepoEnv } from './loadMonorepoEnv';
import {
  isPrismaConnectionError,
  neonDatabaseUrl,
} from './neonDatabaseUrl';

loadMonorepoEnv();

type PrismaGlobal = typeof globalThis & {
  __arPrisma?: PrismaClient;
  __arPrismaKeepalive?: ReturnType<typeof setInterval>;
  __arPrismaShutdownBound?: boolean;
};

const globalForPrisma = globalThis as PrismaGlobal;

/** Placeholder for `next build` / CI when routes are imported but no DB is reachable. */
const BUILD_TIME_DATABASE_URL =
  'postgresql://build:build@127.0.0.1:5432/build?schema=public';

const KEEPALIVE_MS = 4 * 60 * 1000;

function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (raw) return neonDatabaseUrl(raw);

  const isCompileOnly =
    process.env.CI === 'true' ||
    process.env.npm_lifecycle_event === 'build' ||
    process.env.NEXT_PHASE === 'phase-production-build';

  if (isCompileOnly) return BUILD_TIME_DATABASE_URL;

  // Local dev / ts-node-dev without Neon: avoid crashing imports; CMS routes return empty data.
  if (process.env.NODE_ENV !== 'production') {
    return BUILD_TIME_DATABASE_URL;
  }

  throw new Error(
    'DATABASE_URL is missing. Copy apps/backend/.env.example to .env and set Neon credentials.'
  );
}

function createPrismaClient(): PrismaClient {
  const url = resolveDatabaseUrl();
  const client = new PrismaClient({
    datasources: { db: { url } },
    // Neon idle TCP closes trigger noisy engine logs (kind: Closed) — not real failures.
    log: [],
  });
  startPrismaKeepalive(client);
  return client;
}

function startPrismaKeepalive(client: PrismaClient): void {
  if (globalForPrisma.__arPrismaKeepalive) return;

  const tick = () => {
    void client.$queryRaw`SELECT 1`.catch((err) => {
      if (!isPrismaConnectionError(err)) return;
      void reconnectPrisma().catch(() => undefined);
    });
  };

  const timer = setInterval(tick, KEEPALIVE_MS);
  if (typeof timer === 'object' && 'unref' in timer) {
    timer.unref();
  }
  globalForPrisma.__arPrismaKeepalive = timer;
}

export const prisma = globalForPrisma.__arPrisma ?? createPrismaClient();
globalForPrisma.__arPrisma = prisma;

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

if (process.env.NODE_ENV !== 'production' && !globalForPrisma.__arPrismaShutdownBound) {
  globalForPrisma.__arPrismaShutdownBound = true;
  const shutdown = () => {
    if (globalForPrisma.__arPrismaKeepalive) {
      clearInterval(globalForPrisma.__arPrismaKeepalive);
      globalForPrisma.__arPrismaKeepalive = undefined;
    }
    void prisma.$disconnect().catch(() => undefined);
  };
  process.once('beforeExit', shutdown);
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
