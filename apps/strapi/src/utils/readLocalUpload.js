'use strict';

const fs = require('node:fs');
const path = require('node:path');

function pushUnique(list, value) {
  if (value && !list.includes(value)) list.push(value);
}

/**
 * Resolve candidate absolute paths for a Media Library file on disk.
 */
function candidatePaths(strapi, file) {
  const paths = [];
  const publicRoots = [];
  try {
    if (strapi?.dirs?.static?.public) publicRoots.push(strapi.dirs.static.public);
  } catch {
    /* ignore */
  }
  publicRoots.push(path.join(process.cwd(), 'public'));
  publicRoots.push(path.join(__dirname, '..', '..', 'public'));

  const url = file.url || file?.attributes?.url || '';
  const hash = file.hash || file?.attributes?.hash || '';
  const ext = file.ext || file?.attributes?.ext || '';
  const formats = file.formats || file?.attributes?.formats || {};

  const rels = [];
  if (typeof url === 'string' && url.includes('/uploads/')) {
    const rel = url.replace(/^https?:\/\/[^/]+/i, '').replace(/^\//, '');
    if (rel.startsWith('uploads/') && !rel.includes('..')) pushUnique(rels, rel);
  }
  if (hash && ext) {
    const e = ext.startsWith('.') ? ext : `.${ext}`;
    pushUnique(rels, `uploads/${hash}${e}`);
  }
  for (const key of ['large', 'medium', 'small', 'thumbnail']) {
    const fu = formats?.[key]?.url;
    if (typeof fu === 'string' && fu.includes('/uploads/')) {
      const rel = fu.replace(/^https?:\/\/[^/]+/i, '').replace(/^\//, '');
      if (rel.startsWith('uploads/') && !rel.includes('..')) pushUnique(rels, rel);
    }
    const fh = formats?.[key]?.hash;
    const fe = formats?.[key]?.ext;
    if (fh && fe) {
      const e = fe.startsWith('.') ? fe : `.${fe}`;
      pushUnique(rels, `uploads/${fh}${e}`);
    }
  }

  for (const root of publicRoots) {
    for (const rel of rels) {
      pushUnique(paths, path.join(root, rel));
    }
  }
  return paths;
}

/**
 * Read a Media Library file from Strapi public/uploads on disk.
 */
function readLocalUpload(strapi, file) {
  if (!file || typeof file !== 'object') return null;

  for (const abs of candidatePaths(strapi, file)) {
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

/**
 * HTTP fetch fallbacks for Media Library file (public URL, localhost, format variants).
 */
async function fetchUploadBuffer(strapi, file) {
  if (!file || typeof file !== 'object') return null;
  const urls = [];
  const basePublic = String(process.env.PUBLIC_URL || '').replace(/\/$/, '');
  const port = process.env.PORT || '1337';

  const add = (u) => {
    if (typeof u !== 'string' || !u.trim()) return;
    if (/^https?:\/\//i.test(u)) {
      pushUnique(urls, u);
      return;
    }
    const pathPart = u.startsWith('/') ? u : `/${u}`;
    if (basePublic) pushUnique(urls, `${basePublic}${pathPart}`);
    pushUnique(urls, `http://127.0.0.1:${port}${pathPart}`);
    pushUnique(urls, `http://localhost:${port}${pathPart}`);
  };

  add(file.url || file?.attributes?.url);
  const formats = file.formats || file?.attributes?.formats || {};
  for (const key of ['large', 'medium', 'small']) {
    add(formats?.[key]?.url);
  }

  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 32) continue;
      return {
        buffer: buf,
        mime:
          file.mime ||
          file?.attributes?.mime ||
          res.headers.get('content-type') ||
          'image/webp',
        name: file.name || file?.attributes?.name || 'featured.webp',
      };
    } catch {
      /* try next */
    }
  }
  return null;
}

module.exports = { readLocalUpload, fetchUploadBuffer, candidatePaths };
