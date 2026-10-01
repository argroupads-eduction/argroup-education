'use strict';

const {
  assertMarketingSyncTarget,
  buildPayloadSyncBody,
} = require('./marketingSyncSafety');

/**
 * Push Post or Page to marketing MySQL via payload-sync.
 * Delete/Unpublish → published:false (never hard-delete marketing rows).
 * Safe from lifecycles / documents middleware — never throws.
 *
 * @param {import('@strapi/strapi').Core.Strapi} strapi
 * @param {'post'|'page'} type
 * @param {object} entry
 * @param {{ published?: boolean, notifyPush?: boolean }} [opts]
 */
async function syncEntryToMarketing(strapi, type, entry, { published, notifyPush } = {}) {
  const kind = type === 'page' ? 'page' : 'post';
  try {
    const syncUrl = process.env.MARKETING_SYNC_URL;
    const secret = process.env.PAYLOAD_SYNC_SECRET || process.env.REVALIDATE_SECRET;
    if (!syncUrl || !secret) {
      strapi.log.info(`[marketing-sync] skipped (${kind}): MARKETING_SYNC_URL / secret not set`);
      return { ok: false, reason: 'env' };
    }
    assertMarketingSyncTarget(syncUrl);

    const body = buildPayloadSyncBody(kind, entry || {}, {
      published: published !== false,
      notifyPush: notifyPush === true,
    });
    if (!body.slug) {
      strapi.log.warn(`[marketing-sync] skip ${kind}: missing slug`);
      return { ok: false, reason: 'slug' };
    }
    // Refuse spaced / Title-Case slugs — break public URLs + sitemap
    if (/\s/.test(body.slug) || /[A-Z]/.test(body.slug)) {
      strapi.log.error(
        `[marketing-sync] refuse bad slug (use lowercase-hyphens): "${body.slug}"`
      );
      return { ok: false, reason: 'bad-slug' };
    }

    const endpoint = syncUrl.replace(/\/$/, '') + '/api/cms/payload-sync';
    const payload = JSON.stringify(body);
    let res;
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${secret}`,
          },
          body: payload,
        });
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        const code = err?.cause?.code || err?.code || '';
        const msg = String(err?.message || err);
        // Hostinger → www sometimes drops sockets (ECONNRESET); brief retry
        if (
          attempt < 3 &&
          (code === 'ECONNRESET' || code === 'ETIMEDOUT' || /ECONNRESET|ETIMEDOUT|fetch failed/i.test(msg))
        ) {
          strapi.log.warn(
            `[marketing-sync] ${kind} ${body.slug} attempt ${attempt} ${code || msg} — retry`
          );
          await new Promise((r) => setTimeout(r, 400 * attempt));
          continue;
        }
        throw err;
      }
    }
    if (lastErr) throw lastErr;

    const text = await res.text();
    if (!res.ok) {
      strapi.log.error(
        `[marketing-sync] ${kind} ${body.slug} → ${res.status} ${text.slice(0, 300)}`
      );
      return { ok: false, reason: 'http', status: res.status };
    }
    strapi.log.info(
      `[marketing-sync] ${kind} ${body.slug} published=${published !== false} notifyPush=${!!notifyPush} ok`
    );
    return { ok: true };
  } catch (err) {
    strapi.log.error(`[marketing-sync] ${kind} error: ${err.message}`);
    return { ok: false, reason: 'error' };
  }
}

/** @deprecated use syncEntryToMarketing(strapi, 'post', …) */
async function syncPostToMarketing(strapi, entry, opts) {
  return syncEntryToMarketing(strapi, 'post', entry, opts);
}

module.exports = { syncEntryToMarketing, syncPostToMarketing };
