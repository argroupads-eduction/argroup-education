import { NextRequest, NextResponse } from 'next/server';
import { upsertPushSubscription } from '@backend/lib/webPush';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(req: NextRequest) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }

  const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
  const p256dh = typeof body.keys?.p256dh === 'string' ? body.keys.p256dh : '';
  const auth = typeof body.keys?.auth === 'string' ? body.keys.auth : '';

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { success: false, message: 'endpoint and keys are required' },
      { status: 400 }
    );
  }

  try {
    await upsertPushSubscription({
      endpoint,
      p256dh,
      auth,
      userAgent: req.headers.get('user-agent'),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[push/subscribe]', err);
    return NextResponse.json({ success: false, message: 'Could not save subscription' }, { status: 500 });
  }
}
