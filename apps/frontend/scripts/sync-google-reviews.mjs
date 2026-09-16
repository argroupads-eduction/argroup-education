/**
 * Sync Google Maps reviews into data/google-reviews.json for the home page marquee.
 *
 * Requires GOOGLE_MAPS_API_KEY in apps/frontend/.env.local (or env).
 * Optional: OUTSCRAPER_API_KEY to fetch all reviews (Places API returns up to 5).
 * Optional: GOOGLE_PLACE_ID, GOOGLE_PLACE_QUERY
 *
 * Usage: npm run google-reviews:sync
 */

import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outFile = path.join(root, 'data', 'google-reviews.json');

const DEFAULT_QUERY =
  'A R Group of Education Get MBBS Admission Counselling Sector 18 Noida';

function loadEnvFile() {
  const envPath = path.join(root, '.env.local');
  return readFile(envPath, 'utf8')
    .then((text) => {
      for (const line of text.split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const i = t.indexOf('=');
        if (i === -1) continue;
        const key = t.slice(0, i).trim();
        const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    })
    .catch(() => {});
}

async function resolvePlaceId(apiKey, query) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });
  if (!res.ok) {
    console.error('Place search failed:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.places?.[0] ?? null;
}

async function fetchPlacesReviews(apiKey, placeId) {
  const fieldMask = [
    'id',
    'displayName',
    'formattedAddress',
    'rating',
    'userRatingCount',
    'googleMapsUri',
    'reviews',
  ].join(',');

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
  });

  if (!res.ok) {
    console.error('Place details failed:', res.status, await res.text());
    return null;
  }

  return res.json();
}

function mapPlacesReview(review, index) {
  const text = (review.text?.text ?? review.originalText?.text ?? '').trim();
  if (!text) return null;
  return {
    id: review.name ?? `places-review-${index}`,
    name: review.authorAttribution?.displayName?.trim() || 'Google user',
    review: text,
    rating: Math.min(5, Math.max(1, Math.round(review.rating ?? 5))),
    university: review.relativePublishTimeDescription?.trim() || 'Google review',
    country: 'Google',
    source: 'google',
    authorPhotoUrl: review.authorAttribution?.photoUri ?? null,
    publishedAt: review.publishTime ?? null,
  };
}

async function fetchOutscraperReviews(apiKey, query, limit = 120) {
  const url = new URL('https://api.outscraper.com/maps/reviews-v3');
  url.searchParams.set('query', query);
  url.searchParams.set('reviewsLimit', String(limit));
  url.searchParams.set('sort', 'newest');
  url.searchParams.set('async', 'false');
  url.searchParams.set('language', 'en');

  const res = await fetch(url.toString(), {
    headers: { 'X-API-KEY': apiKey },
  });

  if (!res.ok) {
    console.error('Outscraper failed:', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  const rows = data?.data?.[0] ?? data?.[0] ?? [];

  return rows
    .map((row, index) => {
      const text = (row.review_text ?? row.text ?? '').trim();
      if (!text) return null;
      return {
        id: row.review_id ?? row.google_id ?? `outscraper-${index}`,
        name: (row.author_title ?? row.author_name ?? 'Google user').trim(),
        review: text,
        rating: Math.min(5, Math.max(1, Math.round(Number(row.review_rating ?? row.rating ?? 5)))),
        university: row.review_datetime_utc
          ? new Date(row.review_datetime_utc).toLocaleDateString('en-IN', {
              month: 'short',
              year: 'numeric',
            })
          : 'Google review',
        country: 'Google',
        source: 'google',
        authorPhotoUrl: row.author_image ?? row.author_photo ?? null,
        publishedAt: row.review_datetime_utc ?? null,
      };
    })
    .filter(Boolean);
}

async function main() {
  await loadEnvFile();

  const mapsKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  const outscraperKey = process.env.OUTSCRAPER_API_KEY?.trim();
  const placeIdEnv = process.env.GOOGLE_PLACE_ID?.trim();
  const query = process.env.GOOGLE_PLACE_QUERY?.trim() || DEFAULT_QUERY;

  if (!mapsKey && !outscraperKey) {
    console.error('Set GOOGLE_MAPS_API_KEY or OUTSCRAPER_API_KEY in apps/frontend/.env.local');
    process.exit(1);
  }

  let placeId = placeIdEnv;
  let placeMeta = null;

  if (mapsKey) {
    if (!placeId) {
      placeMeta = await resolvePlaceId(mapsKey, query);
      placeId = placeMeta?.id?.replace('places/', '') ?? placeMeta?.id;
    }
    if (!placeId) {
      console.error('Could not resolve Google Place ID. Set GOOGLE_PLACE_ID manually.');
      process.exit(1);
    }
  }

  let summary = {
    placeId: placeId ?? '',
    placeName: 'A R Group of Education',
    rating: 4.2,
    totalReviews: 115,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    address: 'Sector 18, Noida, Uttar Pradesh',
  };

  let reviews = [];

  if (mapsKey && placeId) {
    const place = await fetchPlacesReviews(mapsKey, placeId);
    if (place) {
      summary = {
        placeId: place.id ?? placeId,
        placeName: place.displayName?.text ?? summary.placeName,
        rating: place.rating ?? summary.rating,
        totalReviews: place.userRatingCount ?? summary.totalReviews,
        googleMapsUrl: place.googleMapsUri ?? summary.googleMapsUrl,
        address: place.formattedAddress ?? summary.address,
      };
      reviews = (place.reviews ?? [])
        .map((r, i) => mapPlacesReview(r, i))
        .filter(Boolean);
      console.log(`Places API: ${reviews.length} reviews (max 5), total ${summary.totalReviews}`);
    }
  }

  if (outscraperKey) {
    const bulk = await fetchOutscraperReviews(outscraperKey, placeId || query, 150);
    if (bulk.length) {
      reviews = bulk;
      console.log(`Outscraper: ${reviews.length} reviews imported`);
    }
  }

  if (!reviews.length) {
    console.error('No reviews fetched. Enable Places API or Outscraper.');
    process.exit(1);
  }

  const payload = {
    summary,
    reviews,
    syncedAt: new Date().toISOString(),
  };

  await writeFile(outFile, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Wrote ${reviews.length} reviews → ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
