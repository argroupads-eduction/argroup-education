import { NextRequest, NextResponse } from 'next/server';
import { searchSiteContent } from '@backend/handlers/siteSearch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const limitParam = req.nextUrl.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  try {
    const results = await searchSiteContent(q, Number.isFinite(limit) ? limit : 20);
    return NextResponse.json(
      { query: q.trim(), results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('[search]', error);
    return NextResponse.json({ query: q.trim(), results: [] }, { status: 200 });
  }
}
