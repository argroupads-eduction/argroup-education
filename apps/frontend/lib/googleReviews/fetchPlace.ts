import type { GoogleReviewItem, GoogleReviewsSummary } from './types';

const DEFAULT_QUERY =
  'A R Group of Education MBBS counselling Sector 18 Noida Uttar Pradesh';

const FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'rating',
  'userRatingCount',
  'googleMapsUri',
  'reviews',
].join(',');

type PlacesReview = {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  publishTime?: string;
  authorAttribution?: {
    displayName?: string;
    photoUri?: string;
  };
};

function normalizeReview(review: PlacesReview, index: number): GoogleReviewItem | null {
  const text = (review.text?.text ?? review.originalText?.text ?? '').trim();
  const name = review.authorAttribution?.displayName?.trim() || 'Google user';
  const rating = Math.min(5, Math.max(1, Math.round(review.rating ?? 5)));

  if (!text) return null;

  return {
    id: review.name ?? `google-review-${index}`,
    name,
    review: text,
    rating,
    university: review.relativePublishTimeDescription?.trim() || 'Google review',
    country: 'Google',
    source: 'google',
    authorPhotoUrl: review.authorAttribution?.photoUri ?? null,
    publishedAt: review.publishTime ?? null,
  };
}

export async function resolvePlaceId(apiKey: string, query: string): Promise<string | null> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { places?: { id?: string }[] };
  return data.places?.[0]?.id ?? null;
}

export async function fetchGooglePlaceReviews(options: {
  apiKey: string;
  placeId?: string;
  query?: string;
}): Promise<{ summary: GoogleReviewsSummary; reviews: GoogleReviewItem[] } | null> {
  const { apiKey } = options;
  let placeId = options.placeId?.trim();

  if (!placeId) {
    placeId = (await resolvePlaceId(apiKey, options.query ?? DEFAULT_QUERY)) ?? undefined;
  }

  if (!placeId) return null;

  const placeResourceId = placeId.replace(/^places\//, '');

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeResourceId}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;

  const place = (await res.json()) as {
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
    reviews?: PlacesReview[];
  };

  const summary: GoogleReviewsSummary = {
    placeId: place.id ?? placeId,
    placeName: place.displayName?.text ?? 'AR Group of Education',
    rating: place.rating ?? 0,
    totalReviews: place.userRatingCount ?? 0,
    googleMapsUrl:
      place.googleMapsUri ??
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(DEFAULT_QUERY)}&query_place_id=${placeId}`,
    address: place.formattedAddress,
  };

  const reviews = (place.reviews ?? [])
    .map((r, i) => normalizeReview(r, i))
    .filter((r): r is GoogleReviewItem => r !== null);

  return { summary, reviews };
}
