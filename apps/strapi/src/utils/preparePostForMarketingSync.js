'use strict';

const {
  mediaFileToAbsoluteUrl,
  resolveImageUrlForSync,
} = require('./marketingSyncSafety');
const { normalizePostContentToHtml } = require('./normalizePostContentToHtml');
const { buildPostSchemaJson, applyMetaAutofill } = require('./buildPostSchemaJson');

/**
 * Load published/draft post with media, normalize HTML + FAQ, fill featuredImage URL.
 * Used by documents middleware so every Publish sends structured content to www.
 */
async function loadPreparedPost(strapi, documentId, { preferPublished = true } = {}) {
  if (!documentId) return null;

  let entry = null;
  try {
    if (preferPublished) {
      entry = await strapi.documents('api::post.post').findOne({
        documentId,
        status: 'published',
        populate: ['featuredMedia'],
      });
    }
  } catch {
    entry = null;
  }
  if (!entry) {
    try {
      entry = await strapi.documents('api::post.post').findOne({
        documentId,
        status: 'draft',
        populate: ['featuredMedia'],
      });
    } catch {
      entry = null;
    }
  }
  if (!entry) return null;
  return preparePostEntry(strapi, entry);
}

function preparePostEntry(strapi, entry) {
  if (!entry || typeof entry !== 'object') return null;

  const content = normalizePostContentToHtml(entry.content || '');
  // Featured media (Media Library) always wins over stale featuredImage string
  // (e.g. leftover /images/blog/... paths from old scripts).
  let featuredImage =
    mediaFileToAbsoluteUrl(entry.featuredMedia) ||
    mediaFileToAbsoluteUrl(entry.featuredMedia?.data) ||
    resolveImageUrlForSync(entry.featuredImage) ||
    null;

  // First <img src> in body as last-resort hero
  if (!featuredImage && content) {
    const m = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m) featuredImage = resolveImageUrlForSync(m[1]);
  }

  const prepared = {
    ...entry,
    content,
    featuredImage: featuredImage || entry.featuredImage || null,
    ogImage: resolveImageUrlForSync(entry.ogImage) || featuredImage || null,
  };

  applyMetaAutofill(prepared, content);
  prepared.schemaJson = buildPostSchemaJson({
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

  if (!prepared.featuredImage) {
    strapi.log.warn(
      `[marketing-sync] post "${prepared.slug}" has no featured image — upload Featured media before Publish`
    );
  }
  const hCount = (content.match(/<h[2-3]\b/gi) || []).length;
  strapi.log.info(
    `[marketing-sync] prepared ${prepared.slug} htmlLen=${content.length} h2/h3=${hCount} image=${prepared.featuredImage ? 'yes' : 'no'}`
  );

  return prepared;
}

module.exports = { loadPreparedPost, preparePostEntry };
