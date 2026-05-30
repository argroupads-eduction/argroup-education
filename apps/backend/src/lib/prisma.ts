import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { isPrismaConnectionError, neonDatabaseUrl } from './neonDatabaseUrl';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = neonDatabaseUrl(process.env.DATABASE_URL);
  return new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

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
