import indexData from '@/data/college-image-index.json';
import { isJunkCollegeImage } from '@/lib/collegeImageQuality';
import { resolveWpMediaUrl } from '@/lib/wpMediaUrl';

const BY_SLUG = indexData.bySlug as Record<string, string>;

export function getCollegeImageBySlug(slug: string | null | undefined): string | null {
  if (!slug?.trim()) return null;
  const key = slug.trim().replace(/^\/+|\/+$/g, '');
  const hit = BY_SLUG[key];
  if (!hit || isJunkCollegeImage(hit, key)) return null;
  return resolveWpMediaUrl(hit);
}

/** Stable key for hub-only colleges (no dedicated WP page slug). */
export function collegeNameImageKey(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  const key = name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return key || null;
}

export function resolveCollegeImageUrl(
  slug: string | null | undefined,
  fallbackUrl: string | null | undefined,
  collegeName?: string | null
): string | null {
  const slugCandidates = [
    slug?.trim() || null,
    collegeName ? collegeNameImageKey(collegeName) : null,
  ].filter((s, i, arr): s is string => Boolean(s) && arr.indexOf(s) === i);

  for (const key of slugCandidates) {
    const fromIndex = getCollegeImageBySlug(key);
    if (fromIndex) return fromIndex;
  }

  for (const key of slugCandidates) {
    if (!fallbackUrl || isJunkCollegeImage(fallbackUrl, key)) continue;
    const resolved = resolveWpMediaUrl(fallbackUrl);
    if (resolved) return resolved;
  }

  return null;
}
