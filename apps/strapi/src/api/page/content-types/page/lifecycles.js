'use strict';

const {
  assertMarketingSyncTarget,
  buildPayloadSyncBody,
} = require('../../../utils/marketingSyncSafety');

async function stashPriorPublishState(event) {
  event.state = event.state || {};
  try {
    const where = event.params?.where || {};
    if (!where || Object.keys(where).length === 0) {
      event.state.wasPublished = false;
      return;
    }
    const prior = await strapi.db.query('api::page.page').findOne({ where });
    event.state.wasPublished = prior?.publishedAt != null;
  } catch {
    event.state.wasPublished = false;
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

    const entry = event.result || {};
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
    strapi.log.error(`[marketing-sync] ${type} error: ${err.message}`);
  }
}

function isPublished(entry) {
  return entry?.publishedAt != null;
}

module.exports = {
  async beforeUpdate(event) {
    await stashPriorPublishState(event);
  },
  async afterCreate(event) {
    const published = isPublished(event.result);
    if (published) await syncToMarketing(event, 'page', true);
  },
  async afterUpdate(event) {
    const published = isPublished(event.result);
    const wasPublished = event.state?.wasPublished === true;
    if (!published && !wasPublished) return;
    await syncToMarketing(event, 'page', published);
  },
};
