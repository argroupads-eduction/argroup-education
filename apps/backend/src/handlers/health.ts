import { prisma, reconnectPrisma } from '../lib/prisma';

export async function getHealthStatus() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok' as const,
      database: 'connected' as const,
      timestamp: new Date().toISOString(),
    };
  } catch {
    try {
      await reconnectPrisma();
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok' as const,
        database: 'reconnected' as const,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[health] database unreachable:', err);
      return {
        status: 'degraded' as const,
        database: 'disconnected' as const,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
