import { NextResponse } from 'next/server';
import { getAllSiteGlobals, getSiteGlobal } from '@backend/handlers/globalsSync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { slug } = await context.params;

  try {
    if (slug === 'all') {
      const rows = await getAllSiteGlobals();
      const data = Object.fromEntries(rows.map((r) => [r.slug, r.data]));
      return NextResponse.json(
        { data },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
      );
    }

    const row = await getSiteGlobal(slug);
    if (!row) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    return NextResponse.json(
      { data: row.data, updatedAt: row.updatedAt },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (error) {
    console.error('[globals]', slug, error);
    return NextResponse.json({ data: null }, { status: 200 });
  }
}
