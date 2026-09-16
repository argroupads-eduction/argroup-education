import { NextRequest, NextResponse } from 'next/server';
import { prisma, withPrismaRetry } from '@backend/lib/prisma';
import { isWebPushConfigured } from '@backend/lib/webPush';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Debug / ops: subscription count + VAPID readiness.
 * Auth: Bearer REVALIDATE_SECRET or PUSH_NOTIFY_SECRET.
 */
export async function GET(req: NextRequest) {
  const secret =
    process.env.PUSH_NOTIFY_SECRET?.trim() || process.env.REVALIDATE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ success: false, message: 'Secret not configured' }, { status: 503 });
  }

  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (token !== secret) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const count = await withPrismaRetry(() => prisma.pushSubscription.count());
  const latest = await withPrismaRetry(() =>
    prisma.pushSubscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
      },
    })
  );

  return NextResponse.json({
    success: true,
    vapidConfigured: isWebPushConfigured(),
    subscriptionCount: count,
    latest: latest.map((row) => ({
      id: row.id,
      endpointHost: (() => {
        try {
          return new URL(row.endpoint).host;
        } catch {
          return 'invalid';
        }
      })(),
      userAgent: row.userAgent?.slice(0, 80) ?? null,
      createdAt: row.createdAt,
    })),
  });
}
