import { NextRequest, NextResponse } from 'next/server';
import { verifyPayloadSyncAuth } from '@backend/handlers/payloadSync';
import { reconcileRecentCmsPosts } from '@backend/lib/reconcileRecentCmsPosts';
import { revalidateAfterContentSync } from '@/lib/revalidateSite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Manual / cron: pull recent published Payload posts into live BlogPost rows.
 * Auth: Bearer REVALIDATE_SECRET (same as payload-sync).
 */
export async function POST(req: NextRequest) {
  const authFail = verifyPayloadSyncAuth(req.headers.get('authorization'));
  if (authFail) {
    return NextResponse.json(authFail.body, { status: authFail.status });
  }

  const result = await reconcileRecentCmsPosts({ force: true, limit: 30 });
  if (result.upserted > 0) {
    revalidateAfterContentSync({ slug: 'blog', type: 'post' });
  }

  return NextResponse.json({
    success: true,
    ...result,
    message:
      result.upserted > 0
        ? `Reconciled ${result.upserted} post(s) from Payload CMS`
        : 'Live BlogPost already matches recent CMS publishes',
  });
}
