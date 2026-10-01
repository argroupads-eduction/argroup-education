'use strict';

const {
  assertMarketingSyncTarget,
  buildPayloadSyncBody,
  mediaFileToAbsoluteUrl,
  resolveImageUrlForSync,
} = require('../../../utils/marketingSyncSafety');
const { normalizePostContentToHtml } = require('../../../utils/normalizePostContentToHtml');
const {
  buildPostSchemaJson,
  applyMetaAutofill,
} = require('../../../utils/buildPostSchemaJson');

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

async function syncToMarketing(event, type, published, notifyPush) {
  try {
    const syncUrl = process.env.MARKETING_SYNC_URL;
    const secret = process.env.PAYLOAD_SYNC_SECRET || process.env.REVALIDATE_SECRET;
    if (!syncUrl || !secret) {
      strapi.log.info(`[marketing-sync] skipped (${type}): MARKETING_SYNC_URL / secret not set`);
      return;
    }
    assertMarketingSyncTarget(syncUrl);

    const entry = event.result || event.params?.data || {};
    const body = buildPayloadSyncBody(type, entry, { published, notifyPush });
    if (!body.slug) {
      strapi.log.warn(`[marketing-sync] skip ${type}: missing slug`);
      return;
    }

    const endpoint = syncUrl.replace(/\/$/, '') + '/api/cms/payload-sync';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      strapi.log.error(`[marketing-sync] ${type} ${body.slug} → ${res.status} ${text.slice(0, 300)}`);
      return;
    }
    strapi.log.info(
      `[marketing-sync] ${type} ${body.slug} published=${published} notifyPush=${!!notifyPush} ok`
    );
  } catch (err) {
    // Never fail Save/Publish UI because marketing sync hiccuped.
    strapi.log.error(`[marketing-sync] ${type} error: ${err.message}`);
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
    if (published) await syncToMarketing(event, 'post', true, true);
  },
  async afterUpdate(event) {
    const published = isPublished(event.result);
    const wasPublished = event.state?.wasPublished === true;
    // Draft edits on never-published docs: skip
    if (!published && !wasPublished) return;
    // First publish → notifyPush; later edits → sync only (IndexNow still runs server-side)
    const notifyPush = published && !wasPublished;
    await syncToMarketing(event, 'post', published, notifyPush);
  },
};
