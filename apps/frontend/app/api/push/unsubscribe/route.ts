import { NextRequest, NextResponse } from 'next/server';
import { deletePushSubscription } from '@backend/lib/webPush';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { endpoint?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }
  const endpoint = typeof body.endpoint === 'string' ? body.endpoint.trim() : '';
  if (!endpoint) {
    return NextResponse.json({ success: false, message: 'endpoint required' }, { status: 400 });
  }
  await deletePushSubscription(endpoint);
  return NextResponse.json({ success: true });
}
