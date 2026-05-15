import { NextRequest, NextResponse } from 'next/server';
import { getPayloadCmsServerFetchUrl } from '@/lib/payloadCmsUrl';

export const dynamic = 'force-dynamic';

/** Proxies form posts to Payload so the browser stays same-origin (no CORS). */
export async function POST(req: NextRequest) {
  const base = getPayloadCmsServerFetchUrl();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const res = await fetch(`${base}/api/form-submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    return NextResponse.json(
      { message: 'CMS returned non-JSON', detail: text.slice(0, 300) },
      { status: 502 }
    );
  }

  return NextResponse.json(json, { status: res.status });
}
