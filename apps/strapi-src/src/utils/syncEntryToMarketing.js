'use strict';

const http = require('http');
const https = require('https');
const {
  assertMarketingSyncTarget,
  buildPayloadSyncBody,
} = require('./marketingSyncSafety');
const { readLocalUpload } = require('./readLocalUpload');

function mediaFileAbsolute(_strapi, url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = String(process.env.PUBLIC_URL || '').replace(/\/$/, '');
  if (!base) return null;
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

/**
 * POST JSON to marketing payload-sync.
 * When MARKETING_SYNC_HOST is set (or base host is a raw IP), connect to that
 * IP/host but send Host/SNI for the real site — bypasses Cloudflare ECONNRESET.
 */
function postPayloadSync(base, secret, payload, { timeoutMs = 25000 } = {}) {
  const url = new URL(`${String(base).replace(/\/$/, '')}/api/cms/payload-sync`);
  const hostHeader =
    (process.env.MARKETING_SYNC_HOST || '').trim() ||
    (/^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname)
      ? 'www.argroupofeducation.com'
      : url.hostname);
  const lib = url.protocol === 'https:' ? https : http;
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        servername: hostHeader,
        rejectUnauthorized: false,
        headers: {
          Host: hostHeader,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Authorization: `Bearer ${secret}`,
          Connection: 'close',
          'User-Agent': 'argroup-strapi-marketing-sync/1.0',
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode || 0,
            text: Buffer.concat(chunks).toString('utf8'),
            via: `${url.protocol}//${url.hostname} Host=${hostHeader}`,
          });
        });
      }
    );
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('ETIMEDOUT'));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

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
      strapi.log.error(
        `[marketing-sync] skipped (${kind}): set MARKETING_SYNC_URL + PAYLOAD_SYNC_SECRET on Hostinger env`
      );
      return { ok: false, reason: 'env' };
    }
    try {
      assertMarketingSyncTarget(syncUrl);
    } catch (err) {
      strapi.log.error(
        `[marketing-sync] blocked (${kind}): ${err.message} — set STRAPI_ALLOW_LIVE_SYNC=1 on Hostinger`
      );
      return { ok: false, reason: 'allow-live' };
    }

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

    // Prefer Media Library bytes so live never depends on Hostinger /uploads HTTP.
    if (kind === 'post' && published !== false) {
      const media =
        entry?.featuredMedia ||
        entry?.featuredMedia?.data ||
        body.featuredMedia ||
        null;
      let local = readLocalUpload(strapi, media);
      // If disk miss (redeploy wiped public/uploads), try HTTP from this Strapi host
      if (!local?.buffer?.length && media?.url) {
        try {
          const abs = mediaFileAbsolute(strapi, media.url);
          if (abs) {
            const res = await fetch(abs);
            if (res.ok) {
              const buf = Buffer.from(await res.arrayBuffer());
              if (buf.length > 32) {
                local = {
                  buffer: buf,
                  mime: media.mime || res.headers.get('content-type') || 'image/webp',
                  name: media.name || 'featured.webp',
                };
              }
            }
          }
        } catch (err) {
          strapi.log.warn(
            `[marketing-sync] fetch media failed: ${err?.message || err}`
          );
        }
      }
      if (local?.buffer?.length) {
        body.featuredImageBase64 = local.buffer.toString('base64');
        body.featuredImageMime = local.mime;
        // Clear stale URL so www uses persisted /api/cms/media/{id}
        body.featuredImage = body.featuredImage || null;
        strapi.log.info(
          `[marketing-sync] attached upload ${local.name} (${local.buffer.length} bytes) for ${body.slug}`
        );
      } else if (!body.featuredImage) {
        strapi.log.warn(
          `[marketing-sync] ${body.slug}: no featured media bytes — re-upload Featured media then Publish`
        );
      }
    }

    // Prefer direct Hostinger origin IP (bypass Cloudflare ECONNRESET), then public www.
    // Example: MARKETING_SYNC_ORIGIN=https://195.35.44.199
    //          MARKETING_SYNC_HOST=www.argroupofeducation.com
    const originIp = (process.env.MARKETING_SYNC_ORIGIN_IP || '').trim();
    const bases = [
      process.env.MARKETING_SYNC_ORIGIN,
      originIp
        ? originIp.startsWith('http')
          ? originIp
          : `https://${originIp}`
        : null,
      syncUrl,
      ...(String(process.env.MARKETING_SYNC_URLS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)),
    ]
      .filter(Boolean)
      .map((u) => String(u).replace(/\/$/, ''));
    const uniqueBases = [...new Set(bases)];

    const payload = JSON.stringify(body);
    let result;
    let lastErr;
    let usedBase = uniqueBases[0];

    outer: for (const base of uniqueBases) {
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          result = await postPayloadSync(base, secret, payload);
          lastErr = null;
          usedBase = result.via || base;
          break outer;
        } catch (err) {
          lastErr = err;
          const code = err?.cause?.code || err?.code || '';
          const msg = String(err?.message || err);
          const retryable =
            code === 'ECONNRESET' ||
            code === 'ETIMEDOUT' ||
            code === 'ECONNREFUSED' ||
            code === 'UND_ERR_CONNECT_TIMEOUT' ||
            /ECONNRESET|ETIMEDOUT|fetch failed|aborted|timeout/i.test(msg);
          strapi.log.warn(
            `[marketing-sync] ${kind} ${body.slug} via ${base} attempt ${attempt} ${code || msg}`
          );
          if (retryable && attempt < 4) {
            await new Promise((r) => setTimeout(r, 600 * attempt));
            continue;
          }
          break;
        }
      }
    }
    if (lastErr) throw lastErr;

    if (!result?.ok) {
      strapi.log.error(
        `[marketing-sync] ${kind} ${body.slug} via ${usedBase} → ${result?.status} ${String(result?.text || '').slice(0, 300)}`
      );
      return { ok: false, reason: 'http', status: result?.status };
    }
    strapi.log.info(
      `[marketing-sync] ${kind} ${body.slug} via ${usedBase} published=${published !== false} notifyPush=${!!notifyPush} ok`
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
