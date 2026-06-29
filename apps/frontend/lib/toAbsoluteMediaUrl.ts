import { getSiteUrl } from '@/lib/siteUrl';
import { resolveWpMediaUrl } from '@/lib/wpMediaUrl';

/** Canonical absolute HTTPS media URL for sitemaps, JSON-LD, and OG. */
export function toAbsoluteMediaUrl(
  url: string | null | undefined,
  baseUrl?: string
): string | null {
  if (!url?.trim()) return null;

  const site = (baseUrl ?? getSiteUrl()).replace(/\/$/, '');
  const trimmed = url.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, 'https://');
  }

  const resolved = resolveWpMediaUrl(trimmed) ?? trimmed;
  if (/^https?:\/\//i.test(resolved)) {
    return resolved.replace(/^http:\/\//i, 'https://');
  }

  const path = resolved.startsWith('/') ? resolved : `/${resolved}`;
  return `${site}${path}`;
}
