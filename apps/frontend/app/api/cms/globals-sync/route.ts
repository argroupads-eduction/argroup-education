import { NextRequest, NextResponse } from 'next/server';
import { runGlobalsSync, verifyPayloadSyncAuth } from '@backend/handlers/globalsSync';

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

  const result = await runGlobalsSync(body as Parameters<typeof runGlobalsSync>[0]);
  return NextResponse.json(result.body, { status: result.status });
}
