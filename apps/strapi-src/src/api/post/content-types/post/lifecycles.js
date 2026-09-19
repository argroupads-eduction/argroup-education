'use strict';

const {
  assertStagingOnlySyncTarget,
  buildPayloadSyncBody,
} = require('../../../utils/marketingSyncSafety');

async function syncToMarketing(event, type, published) {
  const syncUrl = process.env.MARKETING_SYNC_URL;
  const secret = process.env.PAYLOAD_SYNC_SECRET || process.env.REVALIDATE_SECRET;
  if (!syncUrl || !secret) {
    strapi.log.info(`[marketing-sync] skipped (${type}): MARKETING_SYNC_URL / secret not set`);
    return;
  }
  assertStagingOnlySyncTarget(syncUrl);

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
}

module.exports = {
  async afterCreate(event) {
    const published = event.result?.publishedAt != null;
    if (published) await syncToMarketing(event, 'post', true);
  },
  async afterUpdate(event) {
    const published = event.result?.publishedAt != null;
    await syncToMarketing(event, 'post', published);
  },
};
