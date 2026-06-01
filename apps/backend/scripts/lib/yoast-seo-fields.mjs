/** SEO fields imported from Yoast (never content, title, slug, or images). */
export const YOAST_SEO_FIELD_KEYS = [
  'metaTitle',
  'metaDescription',
  'canonicalUrl',
  'ogTitle',
  'ogDescription',
  'twitterTitle',
  'twitterDescription',
];

/**
 * @param {Record<string, string | null | undefined>} seo
 */
export function hasAnyYoastSeoField(seo) {
  return YOAST_SEO_FIELD_KEYS.some((k) => {
    const v = seo[k];
    return v != null && String(v).trim() !== '';
  });
}

/**
 * @param {Record<string, string | null | undefined>} seo
 */
export function prismaSeoOnlyUpdate(seo) {
  /** @type {Record<string, string>} */
  const data = {};
  for (const key of YOAST_SEO_FIELD_KEYS) {
    const v = seo[key];
    if (v != null && String(v).trim() !== '') {
      data[key] = String(v).trim();
    }
  }
  return data;
}

/**
 * @param {...(string | null | undefined)[]} values
 * @returns {string | null}
 */
export function pickFirst(...values) {
  for (const v of values) {
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return null;
}

/**
 * @param {string | null | undefined} permalink
 * @returns {string | null}
 */
export function slugFromPermalink(permalink) {
  if (!permalink) return null;
  const raw = String(permalink).trim();
  if (!raw) return null;

  try {
    const u = new URL(raw);
    const parts = u.pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : null;
  } catch {
    const path = raw
      .replace(/^https?:\/\/[^/]+/i, '')
      .replace(/^\?.*$/, '')
      .replace(/^\/|\/$/g, '');
    const parts = path.split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : null;
  }
}
