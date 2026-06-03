import { NextResponse } from 'next/server';
import { getNavPages } from '@backend/handlers/navPages';
import { isBackendPrimaryContent } from '@/lib/payloadCmsUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
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
  } catch (error) {
    console.error('[nav-pages]', error);
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
