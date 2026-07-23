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
  if (result.ok) {
    revalidateAfterContentSync({
      slug: result.body.slug,
      type: result.body.type,
    });

    // New published blog from Payload → push to everyone who installed the PWA.
    if (
      result.body.type === 'post' &&
      result.body.published &&
      result.body.isNew &&
      result.body.title
    ) {
      void notifyNewBlogPush({
        title: result.body.title,
        slug: result.body.slug,
        excerpt: result.body.excerpt,
      }).catch((err) => console.error('[push] blog notify failed', err));
    }
  }

  return NextResponse.json(
    {
      ...result.body,
      ...(result.ok
        ? { revalidated: true, message: 'Synced, live site updated without redeploy' }
        : {}),
    },
    { status: result.status }
  );
}
