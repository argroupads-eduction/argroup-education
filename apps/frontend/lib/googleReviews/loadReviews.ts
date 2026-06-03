import { readFile } from 'fs/promises';
import path from 'path';
import type { GoogleReviewsPayload } from './types';
import { fetchGooglePlaceReviews } from './fetchPlace';

const DATA_FILE = path.join(process.cwd(), 'data', 'google-reviews.json');

export async function readCachedGoogleReviews(): Promise<GoogleReviewsPayload | null> {
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as GoogleReviewsPayload;
    if (!parsed?.summary || !Array.isArray(parsed.reviews)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Merge cached review list with live summary counts from Google Places API. */
export async function loadGoogleReviewsForSite(): Promise<GoogleReviewsPayload | null> {
  const cached = await readCachedGoogleReviews();
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  const placeId = process.env.GOOGLE_PLACE_ID?.trim();
  const query = process.env.GOOGLE_PLACE_QUERY?.trim();

  if (!apiKey) return cached;

  const live = await fetchGooglePlaceReviews({ apiKey, placeId, query });
  if (!live) return cached;

  if (cached?.reviews.length) {
    return {
      ...cached,
      summary: {
        ...cached.summary,
        ...live.summary,
        totalReviews: Math.max(live.summary.totalReviews, cached.reviews.length),
      },
      syncedAt: cached.syncedAt,
    };
  }

  return {
    summary: live.summary,
    reviews: live.reviews,
    syncedAt: new Date().toISOString(),
  };
}
