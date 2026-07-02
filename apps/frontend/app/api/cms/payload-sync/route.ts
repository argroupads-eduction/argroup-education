import { NextRequest, NextResponse } from 'next/server';
import { runPayloadSync, verifyPayloadSyncAuth } from '@backend/handlers/payloadSync';
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
