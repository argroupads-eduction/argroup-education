import airportDiariesData from '@/data/airport-diaries.json';

export type AirportDiaryImage = {
  id: string;
  src: string;
  alt: string;
};

/** Prefer bundled /images/airport-diaries/* — wp-content is not in Amplify/Hostinger deploys. */
const VALID_IMAGES = airportDiariesData.images
  .filter((img) => Boolean(img.src?.trim()) && !img.src.endsWith('.svg'))
  .map((img) => ({
    ...img,
    src: img.src.trim(),
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
