import airportDiariesData from '@/data/airport-diaries.json';

export type AirportDiaryImage = {
  id: string;
  src: string;
  alt: string;
};

const WP_MEDIA_HOST = /^(?:https?:)?\/\/(?:www\.)?argroupofeducation\.com/i;

/** Static /wp-content/uploads paths — Vercel CDN. Avoid /api/wp-media (serverless cannot read public/). */
function toBundledWpUploadPath(src: string): string {
  const trimmed = src.trim();
  if (trimmed.startsWith('/wp-content/uploads/')) return trimmed;

  const withoutHost = trimmed.replace(WP_MEDIA_HOST, '').replace(/^\/+/, '');
  if (withoutHost.startsWith('wp-content/uploads/')) return `/${withoutHost}`;

  const match = trimmed.match(/wp-content\/(uploads\/.+)$/i);
  if (match) return `/wp-content/${match[1]}`;

  return trimmed;
}

const VALID_IMAGES = airportDiariesData.images
  .filter((img) => img.src.includes('wp-content/uploads') && !img.src.endsWith('.svg'))
  .map((img) => ({
    ...img,
    src: toBundledWpUploadPath(img.src),
  })) satisfies AirportDiaryImage[];

export const AIRPORT_DIARIES = {
  title: airportDiariesData.title,
  subtitle: airportDiariesData.subtitle,
  hubHref: airportDiariesData.hubHref,
  images: VALID_IMAGES,
} as const;

/** Destinations shown on the animated departure ticker */
export const AIRPORT_DIARIES_DESTINATIONS = [
  'DEL → TBS',
  'DEL → ALA',
  'DEL → BISH',
  'DEL → MOW',
  'DEL → TAS',
  'DEL → KTM',
  'DEL → DAC',
  'DEL → FRU',
] as const;
