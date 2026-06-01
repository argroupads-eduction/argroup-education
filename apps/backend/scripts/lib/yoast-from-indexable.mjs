import { unserializePhpString } from './parse-wp-sql.mjs';
import { pickFirst } from './yoast-seo-fields.mjs';

/**
 * @param {Record<string, unknown>} row wp_yoast_indexable row
 */
export function yoastSeoFromIndexable(row) {
  const str = (key) => {
    const v = row[key];
    if (v == null || v === '') return null;
    return unserializePhpString(String(v));
  };

  return {
    metaTitle: str('title'),
    metaDescription: str('description'),
    canonicalUrl: str('canonical'),
    ogTitle: str('open_graph_title'),
    ogDescription: str('open_graph_description'),
    twitterTitle: str('twitter_title'),
    twitterDescription: str('twitter_description'),
  };
}

/**
 * @param {Map<number, Record<string, unknown>>} byObjectId
 * @returns {Map<number, import('./yoast-seo-fields.mjs').YOAST_SEO_FIELD_KEYS>}
 */
export function indexablesForPostsAndPages(byObjectId) {
  /** @type {Map<number, ReturnType<typeof yoastSeoFromIndexable>>} */
  const map = new Map();

  for (const [objectId, row] of byObjectId) {
    const objectType = String(row.object_type ?? '');
    const subType = String(row.object_sub_type ?? '');

    if (objectType !== 'post') continue;
    if (subType !== 'post' && subType !== 'page') continue;

    const seo = yoastSeoFromIndexable(row);
    map.set(objectId, seo);
  }

  return map;
}

/**
 * Merge indexable row with optional postmeta fallback (indexable wins).
 * @param {Record<string, unknown> | undefined} indexableRow
 * @param {ReturnType<import('./yoast-from-meta.mjs').yoastSeoFromPostmeta> | undefined} fromMeta
 */
export function mergeIndexableAndMeta(indexableRow, fromMeta) {
  const idx = indexableRow ? yoastSeoFromIndexable(indexableRow) : {};
  const meta = fromMeta ?? {};

  return {
    metaTitle: pickFirst(idx.metaTitle, meta.metaTitle),
    metaDescription: pickFirst(idx.metaDescription, meta.metaDescription),
    canonicalUrl: pickFirst(idx.canonicalUrl, meta.canonicalUrl),
    ogTitle: pickFirst(idx.ogTitle, meta.ogTitle),
    ogDescription: pickFirst(idx.ogDescription, meta.ogDescription),
    twitterTitle: pickFirst(idx.twitterTitle, meta.twitterTitle),
    twitterDescription: pickFirst(idx.twitterDescription, meta.twitterDescription),
  };
}
