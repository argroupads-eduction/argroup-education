'use strict';

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const {
  assertMarketingSyncTarget,
  buildPayloadSyncBody,
} = require('./marketingSyncSafety');
const { readLocalUpload } = require('./readLocalUpload');

function log(strapi, level, msg) {
  // Hostinger Runtime logs reliably show console.*; strapi.log can be quieter.
  const line = `[marketing-sync] ${msg}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
  try {
    if (strapi?.log?.[level]) strapi.log[level](line);
  } catch {
    /* ignore */
  }
}

function mediaFileAbsolute(_strapi, url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = String(process.env.PUBLIC_URL || '').replace(/\/$/, '');
  if (!base) return null;
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

function newId() {
  return `c${Date.now().toString(36)}${crypto.randomBytes(6).toString('hex')}`;
}

/**
 * POST JSON to marketing payload-sync (HTTP).
 * Hostinger→own public IP often hairpins (ECONNRESET); Cloudflare www also resets.
 */
function postPayloadSync(base, secret, payload, { timeoutMs = 20000 } = {}) {
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

function jsonCol(v, fallback) {
  if (v == null) return JSON.stringify(fallback);
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return JSON.stringify(fallback);
  }
}

/**
 * Direct write to marketing MySQL BlogPost/SitePage — bypasses HTTP/Cloudflare/hairpin.
 * Set MARKETING_DATABASE_URL to the same value as marketing site DATABASE_URL.
 */
async function upsertMarketingMysql(strapi, kind, body) {
  const raw = (process.env.MARKETING_DATABASE_URL || '').trim();
  if (!raw) return { ok: false, reason: 'no-db-url' };

  let mysql;
  try {
    mysql = require('mysql2/promise');
  } catch (err) {
    log(strapi, 'error', `mysql2 missing: ${err.message}`);
    return { ok: false, reason: 'no-mysql2' };
  }

  const u = new URL(raw);
  const conn = await mysql.createConnection({
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
    connectTimeout: 15000,
  });

  try {
    const published = body.published !== false;
    const publishedAt = body.publishedAt
      ? new Date(body.publishedAt)
      : published
        ? new Date()
        : null;
    const now = new Date();

    if (kind === 'page') {
      const [rows] = await conn.query('SELECT id FROM SitePage WHERE slug = ? LIMIT 1', [
        body.slug,
      ]);
      if (!published) {
        if (rows.length) {
          await conn.query(
            'UPDATE SitePage SET published = 0, updatedAt = ? WHERE slug = ?',
            [now, body.slug]
          );
        }
        return { ok: true, via: 'mysql:SitePage:unpublish' };
      }
      if (rows.length) {
        await conn.query(
          `UPDATE SitePage SET title=?, content=?, excerpt=?, featuredImage=?, metaTitle=?,
           metaDescription=?, canonicalUrl=?, ogImage=?, published=1, publishedAt=COALESCE(?, publishedAt),
           updatedAt=? WHERE slug=?`,
          [
            body.title || body.slug,
            body.content || '',
            body.excerpt || '',
            body.featuredImage || null,
            body.metaTitle || null,
            body.metaDescription || null,
            body.canonicalUrl || null,
            body.ogImage || body.featuredImage || null,
            publishedAt,
            now,
            body.slug,
          ]
        );
      } else {
        const wpId =
          920_000_000 +
          (Math.abs(
            [...body.slug].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 0)
          ) %
            9_000_000);
        await conn.query(
          `INSERT INTO SitePage
           (id, wpId, title, slug, content, excerpt, featuredImage, metaTitle, metaDescription,
            canonicalUrl, keywords, ogImage, navEnabled, navSortOrder, published, publishedAt, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, ?, ?, ?)`,
          [
            newId(),
            wpId,
            body.title || body.slug,
            body.slug,
            body.content || '',
            body.excerpt || '',
            body.featuredImage || null,
            body.metaTitle || null,
            body.metaDescription || null,
            body.canonicalUrl || null,
            jsonCol(body.keywords, []),
            body.ogImage || body.featuredImage || null,
            publishedAt || now,
            now,
            now,
          ]
        );
      }
      return { ok: true, via: 'mysql:SitePage' };
    }

    // post → BlogPost
    const [rows] = await conn.query('SELECT id FROM BlogPost WHERE slug = ? LIMIT 1', [
      body.slug,
    ]);
    if (!published) {
      if (rows.length) {
        await conn.query(
          'UPDATE BlogPost SET published = 0, updatedAt = ? WHERE slug = ?',
          [now, body.slug]
        );
      }
      return { ok: true, via: 'mysql:BlogPost:unpublish' };
    }

    const title = body.title || body.slug;
    const content = body.content || '';
    const excerpt =
      body.excerpt ||
      String(content)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500);

    if (rows.length) {
      await conn.query(
        `UPDATE BlogPost SET title=?, content=?, excerpt=?, featuredImage=?, category=?,
         tags=?, metaTitle=?, metaDescription=?, canonicalUrl=?, focusKeyword=?, keywords=?,
         ogImage=?, author=?, published=1, publishedAt=COALESCE(?, publishedAt), updatedAt=?
         WHERE slug=?`,
        [
          title,
          content,
          excerpt,
          body.featuredImage || null,
          body.category || 'Blog',
          jsonCol(body.tags, []),
          body.metaTitle || null,
          body.metaDescription || null,
          body.canonicalUrl || null,
          body.focusKeyword || null,
          jsonCol(body.keywords, []),
          body.ogImage || body.featuredImage || null,
          body.author || 'AR Group',
          publishedAt,
          now,
          body.slug,
        ]
      );
    } else {
      await conn.query(
        `INSERT INTO BlogPost
         (id, title, slug, content, excerpt, featuredImage, category, tags, metaTitle,
          metaDescription, canonicalUrl, focusKeyword, keywords, ogImage, author, published,
          publishedAt, views, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0, ?, ?)`,
        [
          newId(),
          title,
          body.slug,
          content,
          excerpt,
          body.featuredImage || null,
          body.category || 'Blog',
          jsonCol(body.tags, []),
          body.metaTitle || null,
          body.metaDescription || null,
          body.canonicalUrl || null,
          body.focusKeyword || null,
          jsonCol(body.keywords, []),
          body.ogImage || body.featuredImage || null,
          body.author || 'AR Group',
          publishedAt || now,
          now,
          now,
        ]
      );
    }
    return { ok: true, via: 'mysql:BlogPost' };
  } finally {
    await conn.end();
  }
}

async function syncEntryToMarketing(strapi, type, entry, { published, notifyPush } = {}) {
  const kind = type === 'page' ? 'page' : 'post';
  log(strapi, 'info', `start kind=${kind} published=${published !== false} action-notify=${!!notifyPush}`);

  try {
    const syncUrl = process.env.MARKETING_SYNC_URL;
    const secret = process.env.PAYLOAD_SYNC_SECRET || process.env.REVALIDATE_SECRET;
    const hasDb = Boolean((process.env.MARKETING_DATABASE_URL || '').trim());

    if (!syncUrl && !hasDb) {
      log(
        strapi,
        'error',
        'skipped: set MARKETING_SYNC_URL + PAYLOAD_SYNC_SECRET and/or MARKETING_DATABASE_URL'
      );
      return { ok: false, reason: 'env' };
    }

    if (syncUrl) {
      try {
        assertMarketingSyncTarget(syncUrl);
      } catch (err) {
        log(
          strapi,
          'error',
          `blocked: ${err.message} — set STRAPI_ALLOW_LIVE_SYNC=1`
        );
        if (!hasDb) return { ok: false, reason: 'allow-live' };
      }
    }

    const body = buildPayloadSyncBody(kind, entry || {}, {
      published: published !== false,
      notifyPush: notifyPush === true,
    });
    if (!body.slug) {
      log(strapi, 'warn', `skip ${kind}: missing slug`);
      return { ok: false, reason: 'slug' };
    }
    if (/\s/.test(body.slug) || /[A-Z]/.test(body.slug)) {
      log(strapi, 'error', `refuse bad slug: "${body.slug}"`);
      return { ok: false, reason: 'bad-slug' };
    }

    log(strapi, 'info', `slug=${body.slug} contentLen=${(body.content || '').length}`);

    if (kind === 'post' && published !== false) {
      const media =
        entry?.featuredMedia ||
        entry?.featuredMedia?.data ||
        body.featuredMedia ||
        null;
      let local = readLocalUpload(strapi, media);
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
          log(strapi, 'warn', `fetch media failed: ${err?.message || err}`);
        }
      }
      if (local?.buffer?.length) {
        body.featuredImageBase64 = local.buffer.toString('base64');
        body.featuredImageMime = local.mime;
        body.featuredImage = body.featuredImage || null;
        log(
          strapi,
          'info',
          `attached upload ${local.name} (${local.buffer.length} bytes)`
        );
      }
    }

    // 1) HTTP attempts (may fail on Hostinger hairpin / Cloudflare)
    let httpOk = false;
    if (syncUrl && secret) {
      const originIp = (process.env.MARKETING_SYNC_ORIGIN_IP || '').trim();
      const bases = [
        process.env.MARKETING_SYNC_ORIGIN,
        originIp
          ? originIp.startsWith('http')
            ? originIp
            : `https://${originIp}`
          : null,
        syncUrl,
      ]
        .filter(Boolean)
        .map((u) => String(u).replace(/\/$/, ''));
      const uniqueBases = [...new Set(bases)];
      const payload = JSON.stringify(body);

      for (const base of uniqueBases) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            log(strapi, 'info', `HTTP try ${base} attempt ${attempt}`);
            const result = await postPayloadSync(base, secret, payload);
            if (result.ok) {
              log(
                strapi,
                'info',
                `HTTP ok via ${result.via} slug=${body.slug}`
              );
              httpOk = true;
              break;
            }
            log(
              strapi,
              'warn',
              `HTTP ${result.status} via ${result.via}: ${String(result.text).slice(0, 200)}`
            );
          } catch (err) {
            log(
              strapi,
              'warn',
              `HTTP error via ${base}: ${err?.code || err?.message || err}`
            );
            if (attempt < 2) {
              await new Promise((r) => setTimeout(r, 500 * attempt));
            }
          }
        }
        if (httpOk) break;
      }
    }

    if (httpOk) return { ok: true };

    // 2) Direct MySQL fallback (reliable on Hostinger)
    if (hasDb) {
      try {
        // featuredImageBase64 not usable in raw MySQL path — keep URL if any
        const dbBody = { ...body };
        delete dbBody.featuredImageBase64;
        const dbRes = await upsertMarketingMysql(strapi, kind, dbBody);
        if (dbRes.ok) {
          log(strapi, 'info', `MySQL ok via ${dbRes.via} slug=${body.slug}`);
          return { ok: true, via: dbRes.via };
        }
        log(strapi, 'error', `MySQL failed: ${dbRes.reason}`);
      } catch (err) {
        log(strapi, 'error', `MySQL error: ${err.message}`);
      }
    } else {
      log(
        strapi,
        'error',
        'HTTP failed and MARKETING_DATABASE_URL not set — add marketing DATABASE_URL as MARKETING_DATABASE_URL'
      );
    }

    return { ok: false, reason: 'all-failed' };
  } catch (err) {
    log(strapi, 'error', `${kind} error: ${err.message}`);
    return { ok: false, reason: 'error' };
  }
}

async function syncPostToMarketing(strapi, entry, opts) {
  return syncEntryToMarketing(strapi, 'post', entry, opts);
}

module.exports = { syncEntryToMarketing, syncPostToMarketing, upsertMarketingMysql };
