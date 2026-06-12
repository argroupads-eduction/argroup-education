import airportDiariesData from '@/data/airport-diaries.json';
import { resolveWpMediaUrl } from '@/lib/wpMediaUrl';

export type AirportDiaryImage = {
  id: string;
  src: string;
  alt: string;
};

const VALID_IMAGES = airportDiariesData.images
  .filter((img) => img.src.includes('wp-content/uploads') && !img.src.endsWith('.svg'))
  .map((img) => ({
    ...img,
    src: resolveWpMediaUrl(img.src) ?? img.src,
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
