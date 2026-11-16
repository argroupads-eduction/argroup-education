/** Production canonical origin — always www (never apex). */
export const CANONICAL_SITE_ORIGIN = 'https://www.argroupofeducation.com';

const APEX_HOST = 'argroupofeducation.com';
const WWW_HOST = 'www.argroupofeducation.com';

/**
 * Force apex → www on our marketing host. Leaves localhost / other hosts alone.
 * Never rewrites www → apex.
 */
export function canonicalizeSiteOrigin(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, '');
  if (!trimmed) return CANONICAL_SITE_ORIGIN;

  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    if (url.hostname.toLowerCase() === APEX_HOST) {
      url.hostname = WWW_HOST;
    }
    return url.origin;
  } catch {
    return trimmed;
  }
}

/** Rewrite absolute URLs that use apex host to www (paths/query preserved). */
export function canonicalizePublicUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  try {
    const url = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : trimmed);
    if (url.hostname.toLowerCase() === APEX_HOST) {
      url.hostname = WWW_HOST;
      url.protocol = 'https:';
      return url.href;
    }
    if (url.protocol === 'http:' && url.hostname.toLowerCase() === WWW_HOST) {
      url.protocol = 'https:';
      return url.href;
    }
  } catch {
    /* keep */
  }
  return trimmed;
}

/** Single canonical site origin for metadata, sitemap, robots, JSON-LD. */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    CANONICAL_SITE_ORIGIN;

  // Local / preview hosts must stay as configured.
  if (/localhost|127\.0\.0\.1|\[::1\]/i.test(raw) || /\.amplifyapp\.com/i.test(raw)) {
    return raw.replace(/\/$/, '');
  }

  return canonicalizeSiteOrigin(raw);
}
