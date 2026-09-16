export type GoogleReviewsSummary = {
  placeId: string;
  placeName: string;
  rating: number;
  totalReviews: number;
  googleMapsUrl: string;
  address?: string;
};

export type GoogleReviewItem = {
  id: string;
  name: string;
  review: string;
  rating: number;
  /** Shown under name — e.g. "2 months ago" */
  university: string;
  /** Badge label */
  country: string;
  source: 'google';
  authorPhotoUrl?: string | null;
  publishedAt?: string | null;
};

export type GoogleReviewsPayload = {
  summary: GoogleReviewsSummary;
  reviews: GoogleReviewItem[];
  syncedAt: string;
};
