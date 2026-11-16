import { NextResponse } from 'next/server';
import { getVapidPublicKey, isWebPushConfigured } from '@backend/lib/webPush';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isWebPushConfigured()) {
    return NextResponse.json(
      { success: false, message: 'Web Push is not configured' },
      { status: 503 }
    );
  }
  const publicKey = getVapidPublicKey();
  return NextResponse.json({ success: true, publicKey });
}
