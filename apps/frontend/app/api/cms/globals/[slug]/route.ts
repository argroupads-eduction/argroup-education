import { NextResponse } from 'next/server';
import { loadMonorepoEnv } from '@backend/lib/loadMonorepoEnv';
import { getAllSiteGlobals, getSiteGlobal } from '@backend/handlers/globalsSync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { slug } = await context.params;

  loadMonorepoEnv();
  if (!process.env.DATABASE_URL?.trim()) {
    if (slug === 'all') {
      return NextResponse.json({ data: {} }, { status: 200 });
    }
    return NextResponse.json({ data: null }, { status: 200 });
  }

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
  } catch {
    if (slug === 'all') {
      return NextResponse.json({ data: {} }, { status: 200 });
    }
    return NextResponse.json({ data: null }, { status: 200 });
  }
}
