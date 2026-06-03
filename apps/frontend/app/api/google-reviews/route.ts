import { NextResponse } from 'next/server';
import { loadGoogleReviewsForSite } from '@/lib/googleReviews/loadReviews';

export const dynamic = 'force-dynamic';

export async function GET() {
  const payload = await loadGoogleReviewsForSite();

  if (!payload) {
    return NextResponse.json(
      { error: 'Reviews not configured. Run npm run google-reviews:sync and set GOOGLE_MAPS_API_KEY.' },
      { status: 503 }
    );
  }

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
