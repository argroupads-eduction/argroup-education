import indexData from '@/data/college-image-index.json';
import { resolveWpMediaUrl } from '@/lib/wpMediaUrl';

const BY_SLUG = indexData.bySlug as Record<string, string>;

export function getCollegeImageBySlug(slug: string | null | undefined): string | null {
  if (!slug?.trim()) return null;
  const key = slug.trim().replace(/^\/+|\/+$/g, '');
  const hit = BY_SLUG[key];
  return hit ? resolveWpMediaUrl(hit) : null;
}

export function resolveCollegeImageUrl(
  slug: string | null | undefined,
  fallbackUrl: string | null | undefined
): string | null {
  return getCollegeImageBySlug(slug) ?? resolveWpMediaUrl(fallbackUrl);
}
