import { NextRequest, NextResponse } from 'next/server';
import { resendPendingLeadEmails } from '@backend/handlers/websiteLead';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Vercel Cron: retry failed lead emails every 5 minutes. Set CRON_SECRET in env. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get('authorization');
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await resendPendingLeadEmails(100);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron/resend-leads]', err);
    return NextResponse.json({ ok: false, message: 'Resend failed' }, { status: 500 });
  }
}
