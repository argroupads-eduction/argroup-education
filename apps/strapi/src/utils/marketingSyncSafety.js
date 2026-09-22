'use strict';

/**
 * Marketing sync safety (Step 3 + Step 4).
 *
 * Step 3: refuse live www URLs.
 * Step 4: allow live only when STRAPI_ALLOW_LIVE_SYNC=1 (explicit cutover).
 */

function assertMarketingSyncTarget(url) {
  const u = String(url || '').trim().toLowerCase();
  if (!u) {
    throw new Error('MARKETING_SYNC_URL is empty — refusing to sync.');
  }

  const isLive =
    u === 'https://www.argroupofeducation.com' ||
    u.startsWith('https://www.argroupofeducation.com/') ||
    u === 'http://www.argroupofeducation.com' ||
    u.startsWith('http://www.argroupofeducation.com/') ||
    u === 'https://argroupofeducation.com' ||
    u.startsWith('https://argroupofeducation.com/') ||
    u === 'http://argroupofeducation.com' ||
    u.startsWith('http://argroupofeducation.com/');

  const allowLive =
    process.env.STRAPI_ALLOW_LIVE_SYNC === '1' ||
    process.env.STRAPI_ALLOW_LIVE_SYNC === 'true';

  if (isLive && !allowLive) {
    throw new Error(
      'Refusing LIVE sync. Set STRAPI_ALLOW_LIVE_SYNC=1 only after Step 4 approval.'
    );
  }

  return true;
}

/** @deprecated use assertMarketingSyncTarget */
function assertStagingOnlySyncTarget(url) {
  return assertMarketingSyncTarget(url);
}

/** Upload file row / relation → absolute URL for marketing BlogPost.featuredImage */
function mediaFileToAbsoluteUrl(file) {
  if (!file) return null;
  if (typeof file === 'string') {
    const s = file.trim();
    return s || null;
  }
  const url = file.url || file?.attributes?.url || null;
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = String(process.env.PUBLIC_URL || '').replace(/\/$/, '');
  if (!base) return url.startsWith('/') ? url : `/${url}`;
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

function buildPayloadSyncBody(type, entry, { published }) {
  const data = entry || {};
  const publishedAt =
    data.publishedAt || data.legacyPublishedAt || data.legacy_published_at || null;

  const fromMedia =
    mediaFileToAbsoluteUrl(data.featuredMedia) ||
    mediaFileToAbsoluteUrl(data.featuredMedia?.data) ||
    null;

  return {
    type,
    slug: data.slug,
    title: data.title,
    content: data.content || '',
    excerpt: data.excerpt || undefined,
    featuredImage: fromMedia || data.featuredImage || null,
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
    publishedAt,
    notifyPush: false,
    pullFromCms: false,
  };
}

module.exports = {
  assertMarketingSyncTarget,
  assertStagingOnlySyncTarget,
  buildPayloadSyncBody,
  mediaFileToAbsoluteUrl,
};
