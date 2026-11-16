/** Yoast SEO Premium postmeta keys (wp_postmeta.meta_key). */
export const YOAST_META_KEYS = {
  title: '_yoast_wpseo_title',
  metadesc: '_yoast_wpseo_metadesc',
  canonical: '_yoast_wpseo_canonical',
  focuskw: '_yoast_wpseo_focuskw',
  ogTitle: '_yoast_wpseo_opengraph-title',
  ogDescription: '_yoast_wpseo_opengraph-description',
  ogImage: '_yoast_wpseo_opengraph-image',
  ogImageId: '_yoast_wpseo_opengraph-image-id',
  twitterTitle: '_yoast_wpseo_twitter-title',
  twitterDescription: '_yoast_wpseo_twitter-description',
  twitterImage: '_yoast_wpseo_twitter-image',
  twitterImageId: '_yoast_wpseo_twitter-image-id',
  schema: '_yoast_wpseo_schema',
};

/** All Yoast keys we read from SQL (includes schema_* variants). */
export const YOAST_META_KEY_SET = new Set([
  ...Object.values(YOAST_META_KEYS),
  '_yoast_wpseo_metakeywords',
  '_yoast_wpseo_schema_page_type',
]);

export function isYoastMetaKey(key) {
  if (!key) return false;
  if (YOAST_META_KEY_SET.has(key)) return true;
  return key.startsWith('_yoast_wpseo_schema');
}
