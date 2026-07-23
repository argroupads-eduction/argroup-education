import { NextRequest, NextResponse } from 'next/server';
import { runPayloadSync, verifyPayloadSyncAuth } from '@backend/handlers/payloadSync';
import { notifyNewBlogPush } from '@backend/lib/webPush';
import { revalidateAfterContentSync } from '@/lib/revalidateSite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authFail = verifyPayloadSyncAuth(req.headers.get('authorization'));
  if (authFail) {
    return NextResponse.json(authFail.body, { status: authFail.status });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const result = await runPayloadSync(body as Parameters<typeof runPayloadSync>[0]);
  if (!result.ok) {
    return NextResponse.json(result.body, { status: result.status });
  }

  revalidateAfterContentSync({
    slug: result.body.slug,
    type: result.body.type,
  });

  let push: { sent: number; removed: number; skipped: boolean } | null = null;

  // Await push so Amplify/serverless does not freeze before delivery finishes.
  if (
    result.body.type === 'post' &&
    result.body.published &&
    result.body.notifyPush &&
    result.body.title
  ) {
    try {
      push = await notifyNewBlogPush({
        title: result.body.title,
        slug: result.body.slug,
        excerpt: result.body.excerpt,
      });
      console.info('[push] blog notify', result.body.slug, push);
    } catch (err) {
      console.error('[push] blog notify failed', err);
      push = { sent: 0, removed: 0, skipped: true };
    }
  }

  return NextResponse.json(
    {
      ...result.body,
      revalidated: true,
      message: 'Synced, live site updated without redeploy',
      ...(push ? { push } : {}),
    },
    { status: result.status }
  );
}
