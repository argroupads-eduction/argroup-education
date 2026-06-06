import { NextRequest, NextResponse } from 'next/server';
import { submitWebsiteLead } from '@backend/handlers/websiteLead';
import { prisma, withPrismaRetry } from '@backend/lib/prisma';
import { scheduleLeadEmailDelivery } from '@/lib/scheduleLeadEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let body: { email?: string; pageUrl?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, message: 'Valid email is required' }, { status: 400 });
  }

  try {
    await withPrismaRetry(() =>
      prisma.subscriber.upsert({
        where: { email },
        create: { email },
        update: { active: true, unsubscribedAt: null },
      })
    );

    const result = await submitWebsiteLead(
      {
        source: 'newsletter',
        formName: 'Newsletter subscription',
        fields: { email },
        pageUrl: body.pageUrl ?? req.headers.get('referer') ?? undefined,
        userAgent: req.headers.get('user-agent') ?? undefined,
      },
      { deferEmail: true }
    );

    if (!result.ok) {
      return NextResponse.json({ success: false, message: result.message }, { status: result.status });
    }

    scheduleLeadEmailDelivery(result.id);

    return NextResponse.json({ success: true, message: 'Successfully subscribed to newsletter!' });
  } catch (error) {
    console.error('[newsletter/subscribe]', error);
    return NextResponse.json({ success: false, message: 'Error subscribing' }, { status: 500 });
  }
}
