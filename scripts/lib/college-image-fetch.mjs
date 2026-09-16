/** Shared remote fetch helpers for bundling college card photos. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { elementorThumbPrefix } from './college-image-quality.mjs';

const DEFAULT_ORIGIN = (process.env.WP_MEDIA_ORIGIN || 'https://argroupofeducation.com').replace(/\/$/, '');

let manifestPaths = null;

function loadManifestPaths() {
  if (manifestPaths) return manifestPaths;
  manifestPaths = [];
  const candidates = [
    path.join(process.cwd(), 'apps/frontend/data/wp-media-manifest.json'),
    path.join(process.cwd(), 'data/wp-media-manifest.json'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../apps/frontend/data/wp-media-manifest.json'),
  ];
  for (const manifestPath of candidates) {
    if (!existsSync(manifestPath)) continue;
    try {
      const data = JSON.parse(readFileSync(manifestPath, 'utf8'));
      manifestPaths = Array.isArray(data.paths) ? data.paths : [];
      break;
    } catch {
      /* try next */
    }
  }
  return manifestPaths;
}

function manifestMatchesForPrefix(prefix, ext) {
  if (!prefix) return [];
  const paths = loadManifestPaths();
  const re = new RegExp(`/${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:-\\d+x\\d+)?\\.${ext}$`, 'i');
  return paths.filter((p) => re.test(`/${p}`) && !/\/elementor\/thumbs\//i.test(p));
}

export function wpRelFromUrl(url) {
  const m = String(url).match(/\/wp-content\/(.+)$/i);
  return m ? m[1] : null;
}

export function candidateRemotePaths(url) {
  const rel = wpRelFromUrl(url);
  if (!rel) {
    if (/^https?:\/\//i.test(String(url))) return [String(url)];
    return [];
  }

  const ordered = [];
  const seen = new Set();
  const add = (p) => {
    if (!p || seen.has(p)) return;
    seen.add(p);
    ordered.push(p);
  };

  if (/^https?:\/\//i.test(String(url))) add(String(url));
  add(rel);

  const file = rel.split('/').pop() || '';
  const prefix = elementorThumbPrefix(file);
  const ext = file.match(/\.(jpe?g|png|webp|gif|avif)$/i)?.[1]?.toLowerCase();

  if (prefix && ext) {
    for (const hit of manifestMatchesForPrefix(prefix, ext)) add(`uploads/${hit}`);
    const base = `${prefix}.${ext}`;
    const dash = base.replace(/[\u2013\u2014]/g, '-');
    for (const year of ['2026', '2025', '2024', '2023']) {
      for (const month of ['06', '07', '08', '09', '04', '05', '02', '03']) {
        add(`uploads/${year}/${month}/${base}`);
        add(`uploads/${year}/${month}/${dash}`);
      }
    }
    add(`uploads/${base}`);
    add(`uploads/${dash}`);
  }

  if (rel.startsWith('uploads/')) add(rel.replace(/^uploads\//, ''));
  return ordered;
}

function isImageBuffer(buf, contentType = '') {
  if (!buf || buf.length < 4000) return false;
  if (contentType && !contentType.startsWith('image/')) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8) return true;
  if (buf[0] === 0x89 && buf[1] === 0x50) return true;
  if (buf[0] === 0x47 && buf[1] === 0x49) return true;
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return true;
  if (buf[0] === 0x3c || buf[0] === 0x7b) return false;
  return contentType.startsWith('image/');
}

export async function fetchFirstImageBuffer(candidates, origin = DEFAULT_ORIGIN, maxAttempts = 18) {
  let attempts = 0;
  for (const candidate of candidates) {
    if (attempts >= maxAttempts) break;
    attempts++;
    const isAbsolute = /^https?:\/\//i.test(candidate);
    const url = isAbsolute
      ? candidate
      : `${origin}/wp-content/${candidate
          .split('/')
          .map((s) => encodeURIComponent(s))
          .join('/')}`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ARGroupCollegeFetcher/1.0', Accept: 'image/*,*/*' },
        signal: AbortSignal.timeout(12_000),
        redirect: 'follow',
      });
      if (!res.ok) continue;
      const type = res.headers.get('content-type') || '';
      const buf = Buffer.from(await res.arrayBuffer());
      if (isImageBuffer(buf, type)) return buf;
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function fetchCollegeImageBuffer(sourceUrl, origin = DEFAULT_ORIGIN) {
  return fetchFirstImageBuffer(candidateRemotePaths(sourceUrl, origin), origin);
}
