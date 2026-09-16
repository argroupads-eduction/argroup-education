import { NextResponse } from 'next/server';
import { loadMonorepoEnv } from '@backend/lib/loadMonorepoEnv';
import { getNavPages } from '@backend/handlers/navPages';
import { isBackendPrimaryContent } from '@/lib/payloadCmsUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  loadMonorepoEnv();
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ data: [] }, { status: 200 });
  }

  try {
    const pages = await getNavPages();
    return NextResponse.json(
      { data: pages },
      {
        headers: {
          'Cache-Control': isBackendPrimaryContent()
            ? 'no-store, max-age=0'
            : 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
