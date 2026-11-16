import { NextResponse } from 'next/server';
import { loadGoogleReviewsForSite } from '@/lib/googleReviews/loadReviews';
import type { GoogleReviewsPayload } from '@/lib/googleReviews/types';

export const dynamic = 'force-dynamic';

const EMPTY_REVIEWS: GoogleReviewsPayload = {
  summary: {
    placeId: '',
    placeName: 'A R Group of Education',
    rating: 4.2,
    totalReviews: 115,
    googleMapsUrl:
      'https://www.google.com/maps/search/?api=1&query=A+R+Group+of+Education+Sector+18+Noida',
    address: 'Sector 18, Noida, Uttar Pradesh',
  },
  reviews: [],
  syncedAt: new Date().toISOString(),
};

export async function GET() {
  const payload = (await loadGoogleReviewsForSite()) ?? EMPTY_REVIEWS;

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
