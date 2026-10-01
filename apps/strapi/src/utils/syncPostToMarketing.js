'use strict';

const {
  assertMarketingSyncTarget,
  buildPayloadSyncBody,
} = require('./marketingSyncSafety');

/**
 * Push a Post entry to marketing BlogPost via payload-sync.
 * Safe to call from lifecycles or documents middleware — never throws.
 */
async function syncPostToMarketing(strapi, entry, { published, notifyPush } = {}) {
  try {
    const syncUrl = process.env.MARKETING_SYNC_URL;
    const secret = process.env.PAYLOAD_SYNC_SECRET || process.env.REVALIDATE_SECRET;
    if (!syncUrl || !secret) {
      strapi.log.info('[marketing-sync] skipped (post): MARKETING_SYNC_URL / secret not set');
      return { ok: false, reason: 'env' };
    }
    assertMarketingSyncTarget(syncUrl);

    const body = buildPayloadSyncBody('post', entry, {
      published: published !== false,
      notifyPush: notifyPush === true,
    });
    if (!body.slug) {
      strapi.log.warn('[marketing-sync] skip post: missing slug');
      return { ok: false, reason: 'slug' };
    }
    // Refuse spaced / unsafe slugs — would break /blog routes + listing
    if (/\s/.test(body.slug) || /[A-Z]/.test(body.slug)) {
      strapi.log.error(
        `[marketing-sync] refuse bad slug (use lowercase-hyphens): "${body.slug}"`
      );
      return { ok: false, reason: 'bad-slug' };
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
      strapi.log.error(`[marketing-sync] post ${body.slug} → ${res.status} ${text.slice(0, 300)}`);
      return { ok: false, reason: 'http', status: res.status };
    }
    strapi.log.info(
      `[marketing-sync] post ${body.slug} published=${published !== false} notifyPush=${!!notifyPush} ok`
    );
    return { ok: true };
  } catch (err) {
    strapi.log.error(`[marketing-sync] post error: ${err.message}`);
    return { ok: false, reason: 'error' };
  }
}

module.exports = { syncPostToMarketing };
