import { YOAST_META_KEYS } from './yoast-meta-keys.mjs';
import { unserializePhpString } from './parse-wp-sql.mjs';

/**
 * @param {Map<string, string>} meta
 * @param {Map<number, { guid: string | null, type: string }>} postsById
 */
export function yoastSeoFromPostmeta(meta, postsById) {
  const get = (key) => {
    const v = meta.get(key);
    return v != null && String(v).trim() !== '' ? unserializePhpString(String(v)) : null;
  };

  const schemaEntries = {};
  for (const [key, value] of meta.entries()) {
    if (key.startsWith('_yoast_wpseo_schema')) {
      schemaEntries[key] = unserializePhpString(value) ?? value;
    }
  }

  let schemaJson = null;
  const rawSchema = get(YOAST_META_KEYS.schema);
  if (rawSchema) {
    try {
      schemaJson = JSON.parse(rawSchema);
    } catch {
      schemaJson = { raw: rawSchema };
    }
  } else if (Object.keys(schemaEntries).length > 0) {
    schemaJson = schemaEntries;
  }

  const ogImageRaw = get(YOAST_META_KEYS.ogImage) || get(YOAST_META_KEYS.ogImageId);
  const twitterImageRaw = get(YOAST_META_KEYS.twitterImage) || get(YOAST_META_KEYS.twitterImageId);

  const focusKeyword = get(YOAST_META_KEYS.focuskw);

  return {
    metaTitle: get(YOAST_META_KEYS.title),
    metaDescription: get(YOAST_META_KEYS.metadesc),
    canonicalUrl: get(YOAST_META_KEYS.canonical),
    focusKeyword,
    keywords: focusKeyword ? [focusKeyword] : [],
    ogTitle: get(YOAST_META_KEYS.ogTitle),
    ogDescription: get(YOAST_META_KEYS.ogDescription),
    ogImage: resolveMediaUrl(ogImageRaw, postsById),
    twitterTitle: get(YOAST_META_KEYS.twitterTitle),
    twitterDescription: get(YOAST_META_KEYS.twitterDescription),
    twitterImage: resolveMediaUrl(twitterImageRaw, postsById),
    schemaJson,
  };
}

/** Postmeta → SEO-only fields (no images / schema). */
export function yoastSeoOnlyFromPostmeta(meta, postsById) {
  const full = yoastSeoFromPostmeta(meta, postsById);
  return {
    metaTitle: full.metaTitle,
    metaDescription: full.metaDescription,
    canonicalUrl: full.canonicalUrl,
    ogTitle: full.ogTitle,
    ogDescription: full.ogDescription,
    twitterTitle: full.twitterTitle,
    twitterDescription: full.twitterDescription,
  };
}

/**
 * @param {string | null} raw
 * @param {Map<number, { guid: string | null, type: string }>} postsById
 */
function resolveMediaUrl(raw, postsById) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const id = Number(trimmed);
  if (!Number.isFinite(id) || id <= 0) return trimmed;

  const attachment = postsById.get(id);
  if (attachment?.type === 'attachment' && attachment.guid) {
    return attachment.guid;
  }

  return null;
}

/**
 * @param {ReturnType<typeof yoastSeoFromPostmeta>} seo
 */
export function countPopulatedSeoFields(seo) {
  const fields = [
    'metaTitle',
    'metaDescription',
    'canonicalUrl',
    'focusKeyword',
    'ogTitle',
    'ogDescription',
    'ogImage',
    'twitterTitle',
    'twitterDescription',
    'schemaJson',
  ];
  let count = 0;
  for (const key of fields) {
    const v = seo[key];
    if (v == null) continue;
    if (key === 'schemaJson' && typeof v === 'object' && !Object.keys(v).length) continue;
    if (typeof v === 'string' && !v.trim()) continue;
    count += 1;
  }
  return count;
}
