'use strict';

const {
  mediaFileToAbsoluteUrl,
  resolveImageUrlForSync,
} = require('../../../utils/marketingSyncSafety');
const { normalizePostContentToHtml } = require('../../../utils/normalizePostContentToHtml');
const {
  buildPostSchemaJson,
  applyMetaAutofill,
} = require('../../../utils/buildPostSchemaJson');

/** URL-safe slug: lowercase, hyphens, no spaces (live /blog/[slug] + sitemap). */
function sanitizeSlug(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/** Copy Media Library file → featuredImage URL string (marketing MySQL expects a URL). */
async function applyFeaturedMediaUrl(event) {
  const data = event.params?.data;
  if (!data) return;

  if (data.featuredMedia != null) {
    let fileId = data.featuredMedia;
    if (typeof fileId === 'object') {
      fileId =
        fileId.id ??
        fileId.documentId ??
        fileId.connect?.[0]?.id ??
        fileId.connect?.[0] ??
        fileId.set?.[0]?.id ??
        fileId.set?.[0];
    }
    if (fileId != null && fileId !== '') {
      try {
        const file = await strapi.db.query('plugin::upload.file').findOne({
          where: { id: fileId },
        });
        const url = mediaFileToAbsoluteUrl(file);
        if (url) {
          data.featuredImage = url;
          if (!data.ogImage) data.ogImage = url;
        }
      } catch (err) {
        strapi.log.warn(`[post] featuredMedia → URL failed: ${err.message}`);
      }
    }
  }

  // Pasted public URL on featuredImage → also fill ogImage when empty
  if (data.featuredImage && !data.ogImage) {
    const resolved = resolveImageUrlForSync(data.featuredImage);
    if (resolved) data.ogImage = resolved;
  }
}

/**
 * Content → HTML, meta autofill, schemaJson regenerate (every save when title+slug+content).
 * @param {object} [prior] existing DB row for partial updates
 */
function applyContentSchemaDefaults(event, prior) {
  const data = event.params?.data;
  if (!data || typeof data !== 'object') return;

  if (typeof data.slug === 'string' && data.slug.trim()) {
    const clean = sanitizeSlug(data.slug);
    if (clean) data.slug = clean;
  }

  const title = data.title != null ? data.title : prior?.title;
  const slug = data.slug != null ? data.slug : prior?.slug;
  const rawContent = data.content != null ? data.content : prior?.content;
  if (title == null || slug == null || rawContent == null) return;

  const content = normalizePostContentToHtml(rawContent);
  data.content = content;

  const prepared = {
    title,
    slug,
    content,
    excerpt: data.excerpt != null ? data.excerpt : prior?.excerpt,
    metaTitle: data.metaTitle != null ? data.metaTitle : prior?.metaTitle,
    metaDescription:
      data.metaDescription != null ? data.metaDescription : prior?.metaDescription,
    featuredImage:
      data.featuredImage != null ? data.featuredImage : prior?.featuredImage,
    ogImage: data.ogImage != null ? data.ogImage : prior?.ogImage,
    author: data.author != null ? data.author : prior?.author,
    publishedAt: data.publishedAt != null ? data.publishedAt : prior?.publishedAt,
    legacyPublishedAt:
      data.legacyPublishedAt != null
        ? data.legacyPublishedAt
        : prior?.legacyPublishedAt,
  };

  applyMetaAutofill(prepared, content);
  if (prepared.metaTitle) data.metaTitle = prepared.metaTitle;
  if (prepared.metaDescription) data.metaDescription = prepared.metaDescription;
  if (prepared.excerpt && data.excerpt == null) data.excerpt = prepared.excerpt;

  data.schemaJson = buildPostSchemaJson({
    title: prepared.title,
    slug: prepared.slug,
    content,
    excerpt: prepared.excerpt,
    metaDescription: prepared.metaDescription,
    featuredImage: prepared.featuredImage,
    ogImage: prepared.ogImage,
    publishedAt: prepared.publishedAt,
    legacyPublishedAt: prepared.legacyPublishedAt,
    author: prepared.author || 'AR Group of Education',
  });
}

async function loadPrior(event) {
  event.state = event.state || {};
  try {
    const where = event.params?.where || {};
    if (!where || Object.keys(where).length === 0) {
      event.state.wasPublished = false;
      event.state.prior = null;
      return null;
    }
    const prior = await strapi.db.query('api::post.post').findOne({ where });
    event.state.wasPublished = prior?.publishedAt != null;
    event.state.prior = prior || null;
    return prior;
  } catch {
    event.state.wasPublished = false;
    event.state.prior = null;
    return null;
  }
}

module.exports = {
  async beforeCreate(event) {
    await applyFeaturedMediaUrl(event);
    applyContentSchemaDefaults(event);
  },
  async beforeUpdate(event) {
    const prior = await loadPrior(event);
    await applyFeaturedMediaUrl(event);
    applyContentSchemaDefaults(event, prior);
  },
  // Marketing sync ONLY in documents middleware (apps/strapi/src/index.ts).
  // Do not sync here — draft afterUpdate was setting live published=0.
  async afterCreate() {},
  async afterUpdate() {},
  async beforeDelete(event) {
    await loadPrior(event);
  },
  async afterDelete() {},
};
