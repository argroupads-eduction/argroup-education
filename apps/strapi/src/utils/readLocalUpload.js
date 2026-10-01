'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Read a Media Library file from Strapi public/uploads on disk.
 * Hostinger redeploys can wipe files; returns null if missing.
 */
function readLocalUpload(strapi, file) {
  if (!file || typeof file !== 'object') return null;
  const url = file.url || file?.attributes?.url;
  if (typeof url !== 'string' || !url.includes('/uploads/')) return null;

  const rel = url.replace(/^https?:\/\/[^/]+/i, '').replace(/^\//, '');
  if (!rel.startsWith('uploads/') || rel.includes('..')) return null;

  const candidates = [];
  try {
    if (strapi?.dirs?.static?.public) {
      candidates.push(path.join(strapi.dirs.static.public, rel));
    }
  } catch {
    /* ignore */
  }
  candidates.push(path.join(process.cwd(), 'public', rel));
  candidates.push(path.join(__dirname, '..', '..', 'public', rel));

  for (const abs of candidates) {
    try {
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
        const buf = fs.readFileSync(abs);
        if (buf.length < 32) continue;
        return {
          buffer: buf,
          mime: file.mime || file?.attributes?.mime || 'image/webp',
          name: file.name || file?.attributes?.name || path.basename(abs),
        };
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

module.exports = { readLocalUpload };
