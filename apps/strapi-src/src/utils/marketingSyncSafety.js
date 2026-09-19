/**
 * Safety rails for Strapi Step 3.
 * HARD RULE: never point marketing sync at production unless Step 4 approved.
 */
export function assertStagingOnlySyncTarget(url) {
  const u = String(url || '').trim().toLowerCase();
  if (!u) {
    throw new Error('MARKETING_SYNC_URL is empty — refusing to sync.');
  }
  const blocked = [
    'https://www.argroupofeducation.com',
    'http://www.argroupofeducation.com',
    'https://argroupofeducation.com',
    'http://argroupofeducation.com',
  ];
  for (const b of blocked) {
    if (u === b || u.startsWith(b + '/')) {
      throw new Error(
        `Refusing to sync to LIVE site (${b}). Set MARKETING_SYNC_URL to localhost/staging only until Step 4 approval.`
      );
    }
  }
  return true;
}

export function buildPayloadSyncBody(type, entry, { published }) {
  const data = entry || {};
  return {
    type,
    slug: data.slug,
    title: data.title,
    content: data.content || '',
    excerpt: data.excerpt || undefined,
    featuredImage: data.featuredImage ?? null,
    category: data.category || undefined,
    metaTitle: data.metaTitle ?? null,
    metaDescription: data.metaDescription ?? null,
    canonicalUrl: data.canonicalUrl ?? null,
    ogImage: data.ogImage ?? null,
    focusKeyword: data.focusKeyword ?? null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    ogTitle: data.ogTitle ?? null,
    ogDescription: data.ogDescription ?? null,
    twitterTitle: data.twitterTitle ?? null,
    twitterDescription: data.twitterDescription ?? null,
    schemaJson: data.schemaJson ?? null,
    navEnabled: data.navEnabled,
    navSection: data.navSection ?? null,
    navParent: data.navParent ?? null,
    navLabel: data.navLabel ?? null,
    navSortOrder: data.navSortOrder,
    published: published !== false,
    publishedAt: data.publishedAt || null,
    notifyPush: false,
    pullFromCms: false,
  };
}
