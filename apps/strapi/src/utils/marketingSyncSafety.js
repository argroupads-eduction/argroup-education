'use strict';

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

/**
 * Upload file row / relation → absolute URL for marketing BlogPost.featuredImage.
 * - Absolutize /uploads/ with PUBLIC_URL
 * - Reject other relative URLs (would resolve against www)
 */
function mediaFileToAbsoluteUrl(file) {
  if (!file) return null;
  if (typeof file === 'string') {
    return resolveImageUrlForSync(file);
  }
  const url = file.url || file?.attributes?.url || null;
  if (!url) return null;
  return resolveImageUrlForSync(url);
}

function resolveImageUrlForSync(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return `https:${s}`;

  const isUploads = s === '/uploads' || s.startsWith('/uploads/');
  if (isUploads) {
    const base = String(process.env.PUBLIC_URL || '').replace(/\/$/, '');
    if (!base) return null;
    return `${base}${s.startsWith('/') ? s : `/${s}`}`;
  }

  // Relative non-uploads — reject (do not send to marketing)
  if (s.startsWith('/') || !s.includes('://')) {
    return null;
  }
  return s;
}

function buildPayloadSyncBody(type, entry, { published, notifyPush } = {}) {
  const data = entry || {};
  // Prefer Strapi legacyPublishedAt (editorial date shown on live).
  const legacyPublishedAt =
    data.legacyPublishedAt || data.legacy_published_at || null;
  const publishedAt = legacyPublishedAt || data.publishedAt || null;

  const fromMedia =
    mediaFileToAbsoluteUrl(data.featuredMedia) ||
    mediaFileToAbsoluteUrl(data.featuredMedia?.data) ||
    null;
  // Ignore leftover site-relative /images/... strings when Media Library file exists
  const fromString = resolveImageUrlForSync(data.featuredImage);
  const featuredImage = fromMedia || fromString || null;
  const ogImage =
    resolveImageUrlForSync(data.ogImage) ||
    fromMedia ||
    featuredImage;

  const previousSlug =
    typeof data.previousSlug === 'string' && data.previousSlug.trim()
      ? data.previousSlug.trim()
      : undefined;

  return {
    type,
    slug: data.slug,
    previousSlug:
      previousSlug && previousSlug !== data.slug ? previousSlug : undefined,
    title: data.title,
    content: data.content || '',
    excerpt: data.excerpt || undefined,
    featuredImage,
    category: data.category || undefined,
    metaTitle: data.metaTitle ?? null,
    metaDescription: data.metaDescription ?? null,
    canonicalUrl: data.canonicalUrl ?? null,
    ogImage,
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
    legacyPublishedAt,
    // true only on first publish (lifecycle); IndexNow/sitemap revalidate still run on every published sync
    notifyPush: notifyPush === true,
    pullFromCms: false,
  };
}

module.exports = {
  assertMarketingSyncTarget,
  assertStagingOnlySyncTarget,
  buildPayloadSyncBody,
  mediaFileToAbsoluteUrl,
  resolveImageUrlForSync,
};
