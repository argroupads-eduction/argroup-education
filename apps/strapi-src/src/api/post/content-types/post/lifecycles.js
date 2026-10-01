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
const { syncPostToMarketing } = require('../../../utils/syncPostToMarketing');

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
  } else if (!data.slug && prior?.slug) {
    // leave prior
  } else if (typeof data.title === 'string' && data.title.trim() && !prior?.slug) {
    const fromTitle = sanitizeSlug(data.title);
    if (fromTitle) data.slug = fromTitle;
  }

  if (typeof data.content === 'string' && data.content.trim()) {
    data.content = normalizePostContentToHtml(data.content);
  }

  const title = data.title ?? prior?.title;
  const slug = data.slug ?? prior?.slug;
  const content = data.content ?? prior?.content;
  const featuredImage = data.featuredImage ?? prior?.featuredImage;
  const ogImage = data.ogImage ?? prior?.ogImage;
  const author = data.author ?? prior?.author;

  const mergedForMeta = {
    title,
    excerpt: data.excerpt ?? prior?.excerpt,
    metaTitle: data.metaTitle ?? prior?.metaTitle,
    metaDescription: data.metaDescription ?? prior?.metaDescription,
    ogTitle: data.ogTitle ?? prior?.ogTitle,
    ogDescription: data.ogDescription ?? prior?.ogDescription,
    ogImage: data.ogImage ?? ogImage,
    featuredImage,
  };
  applyMetaAutofill(mergedForMeta, content);
  for (const key of [
    'excerpt',
    'metaTitle',
    'metaDescription',
    'ogTitle',
    'ogDescription',
    'ogImage',
  ]) {
    if (!String(data[key] ?? '').trim() && mergedForMeta[key]) {
      data[key] = mergedForMeta[key];
    }
  }

  if (title && slug && content) {
    const schema = buildPostSchemaJson({
      title,
      slug,
      content,
      excerpt: data.excerpt ?? mergedForMeta.excerpt,
      metaDescription: data.metaDescription ?? mergedForMeta.metaDescription,
      featuredImage,
      ogImage: data.ogImage ?? ogImage,
      publishedAt: data.publishedAt ?? prior?.publishedAt,
      legacyPublishedAt: data.legacyPublishedAt ?? prior?.legacyPublishedAt,
      author: author || 'AR Group of Education',
    });
    if (schema) data.schemaJson = schema;
  }
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

function isPublished(entry) {
  return entry?.publishedAt != null;
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
  async afterCreate(event) {
    const published = isPublished(event.result);
    if (published) {
      await syncPostToMarketing(strapi, event.result, { published: true, notifyPush: true });
    }
  },
  async afterUpdate(event) {
    const published = isPublished(event.result);
    const wasPublished = event.state?.wasPublished === true;
    // Draft edits on never-published docs: skip
    if (!published && !wasPublished) return;
    // First publish → notifyPush; later edits → sync only (IndexNow still runs server-side)
    const notifyPush = published && !wasPublished;
    await syncPostToMarketing(strapi, event.result, { published, notifyPush });
  },
};
