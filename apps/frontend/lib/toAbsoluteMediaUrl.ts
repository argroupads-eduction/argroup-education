import { canonicalizePublicUrl, getSiteUrl } from '@/lib/siteUrl';
import { resolveWpMediaUrl } from '@/lib/wpMediaUrl';

/** Canonical absolute HTTPS media URL for sitemaps, JSON-LD, and OG. */
export function toAbsoluteMediaUrl(
  url: string | null | undefined,
  baseUrl?: string
): string | null {
  if (!url?.trim()) return null;

  const site = canonicalizePublicUrl((baseUrl ?? getSiteUrl()).replace(/\/$/, ''));
  const trimmed = url.trim();

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) {
    const absolute = trimmed.startsWith('//') ? `https:${trimmed}` : trimmed.replace(/^http:\/\//i, 'https://');
    return canonicalizePublicUrl(absolute);
  }

  const resolved = resolveWpMediaUrl(trimmed) ?? trimmed;
  if (/^https?:\/\//i.test(resolved) || resolved.startsWith('//')) {
    const absolute = resolved.startsWith('//') ? `https:${resolved}` : resolved.replace(/^http:\/\//i, 'https://');
    return canonicalizePublicUrl(absolute);
  }

  const path = resolved.startsWith('/') ? resolved : `/${resolved}`;
  return canonicalizePublicUrl(`${site}${path}`);
}
