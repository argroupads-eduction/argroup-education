'use strict';

const {
  assertMarketingSyncTarget,
  buildPayloadSyncBody,
  mediaFileToAbsoluteUrl,
} = require('../../../utils/marketingSyncSafety');

/** Copy Media Library file → featuredImage URL string (marketing MySQL expects a URL). */
async function applyFeaturedMediaUrl(event) {
  const data = event.params?.data;
  if (!data || data.featuredMedia == null) return;

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
  if (fileId == null || fileId === '') return;

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

async function syncToMarketing(event, type, published) {
  try {
    const syncUrl = process.env.MARKETING_SYNC_URL;
    const secret = process.env.PAYLOAD_SYNC_SECRET || process.env.REVALIDATE_SECRET;
    if (!syncUrl || !secret) {
      strapi.log.info(`[marketing-sync] skipped (${type}): MARKETING_SYNC_URL / secret not set`);
      return;
    }
    assertMarketingSyncTarget(syncUrl);

    const entry = event.result || event.params?.data || {};
    const body = buildPayloadSyncBody(type, entry, { published });
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
    strapi.log.info(`[marketing-sync] ${type} ${body.slug} published=${published} ok`);
  } catch (err) {
    // Never fail Save/Publish UI because marketing sync hiccuped.
    strapi.log.error(`[marketing-sync] ${type} error: ${err.message}`);
  }
}

module.exports = {
  async beforeCreate(event) {
    await applyFeaturedMediaUrl(event);
  },
  async beforeUpdate(event) {
    await applyFeaturedMediaUrl(event);
  },
  async afterCreate(event) {
    const published = event.result?.publishedAt != null;
    if (published) await syncToMarketing(event, 'post', true);
  },
  async afterUpdate(event) {
    const published = event.result?.publishedAt != null;
    // Draft saves must not hit live (and must not throw → Internal Server Error).
    if (!published) return;
    await syncToMarketing(event, 'post', true);
  },
};
