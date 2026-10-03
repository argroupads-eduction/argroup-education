import { NextRequest, NextResponse } from 'next/server';
import { readCmsMedia } from '@backend/lib/cmsMediaStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const row = await readCmsMedia(id);
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(row.data), {
    status: 200,
    headers: {
      'Content-Type': row.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
