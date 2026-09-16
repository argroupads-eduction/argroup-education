import { NextRequest, NextResponse } from 'next/server';
import { notifySiteUpdatePush } from '@backend/lib/webPush';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Manual / deploy announcement push.
 * Auth: Bearer REVALIDATE_SECRET (same as Payload sync) or PUSH_NOTIFY_SECRET.
 *
 * Body: { title, body, url?, tag? }
 */
export async function POST(req: NextRequest) {
  const secret =
    process.env.PUSH_NOTIFY_SECRET?.trim() || process.env.REVALIDATE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { success: false, message: 'PUSH_NOTIFY_SECRET / REVALIDATE_SECRET not configured' },
      { status: 503 }
    );
  }

  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (token !== secret) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  let body: { title?: string; body?: string; url?: string; tag?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const message = typeof body.body === 'string' ? body.body.trim() : '';
  if (!title || !message) {
    return NextResponse.json(
      { success: false, message: 'title and body are required' },
      { status: 400 }
    );
  }

  const result = await notifySiteUpdatePush({
    title,
    body: message,
    url: typeof body.url === 'string' ? body.url : '/',
    tag: typeof body.tag === 'string' ? body.tag : 'site-update',
  });

  return NextResponse.json({ success: true, ...result });
}
