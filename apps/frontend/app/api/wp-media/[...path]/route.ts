import path from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';

const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] ?? 'application/octet-stream';
}

function dashVariants(filename: string): string[] {
  const out = new Set([filename]);
  out.add(filename.replace(/[\u2013\u2014]/g, '-'));
  out.add(filename.replace(/-/g, '\u2013'));
  return [...out];
}

function encodeWpContentUrl(origin: string, relativePath: string): string {
  const safe = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const encoded = safe
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${origin}/wp-content/${encoded}`;
}

/** Elementor thumb → try full upload path without hash suffix. */
function elementorThumbAlternates(relativePath: string): string[] {
  if (!relativePath.includes('elementor/thumbs/')) return [];

  const file = relativePath.split('/').pop() ?? '';
  const match = file.match(/^(.+)-[a-z0-9]{16,}\.(jpe?g|png|webp|gif|avif)$/i);
  if (!match) return [];

  const baseFile = `${match[1]}.${match[2]}`;
  // Prefer recent upload months first (MD/MS / college assets cluster in mid–late year).
  const years = ['2025', '2024', '2026', '2023', '2022', '2021', '2020', '2018', '2017'];
  const months = ['09', '10', '08', '07', '06', '05', '04', '03', '02', '01', '11', '12'];

  const alts: string[] = [];
  for (const year of years) {
    for (const month of months) {
      alts.push(`uploads/${year}/${month}/${baseFile}`);
    }
  }
  alts.push(`uploads/${baseFile}`);
  return alts;
}

const PUBLIC_WP_ROOT = path.join(process.cwd(), 'public', 'wp-content');

function resolvePublicWpFile(relativePath: string): string | null {
  const safe = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const resolved = path.resolve(PUBLIC_WP_ROOT, safe);
  const root = path.resolve(PUBLIC_WP_ROOT);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

/**
 * Read bundled media from public/wp-content via fs.
 * NEVER fetch our own /wp-content URLs — next.config rewrites misses back to
 * this route and that creates an infinite proxy storm.
 */
async function readBundledStatic(relativePath: string): Promise<Buffer | null> {
  const filePath = resolvePublicWpFile(relativePath);
  if (!filePath || !existsSync(filePath)) return null;
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

function isImageResponse(res: Response): boolean {
  const contentType = res.headers.get('content-type') ?? '';
  return contentType.startsWith('image/') || contentType.includes('octet-stream');
}

/** True when WP_MEDIA_ORIGIN points at this marketing site (self-proxy = slow storm). */
function isSelfOrBlockedMediaOrigin(origin: string): boolean {
  if (!origin) return true;
  if (/hostingersite\.com/i.test(origin)) return true;
  try {
    const host = new URL(origin).hostname.replace(/^www\./i, '').toLowerCase();
    if (host === 'argroupofeducation.com') return true;
    if (host === 'localhost' || host === '127.0.0.1') return true;
  } catch {
    return true;
  }
  return false;
}

/**
 * Fetch from a *separate* legacy WP/media host only.
 * Cap candidates + short timeout so misses fail fast on shared Hostinger CPU.
 */
async function fetchRemoteWpMedia(relativePath: string): Promise<Response | null> {
  const origin = (
    process.env.WP_MEDIA_ORIGIN ||
    process.env.NEXT_PUBLIC_WP_MEDIA_ORIGIN ||
    ''
  ).replace(/\/$/, '');
  // Never remote-fetch our own Node app (docs used to set WP_MEDIA_ORIGIN=www → 20–30s 404s).
  if (isSelfOrBlockedMediaOrigin(origin)) return null;

  const safe = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const candidates: string[] = [safe];
  // Keep `uploads/` prefix — stripping it built invalid /wp-content/2025/09/... URLs.
  for (const alt of elementorThumbAlternates(safe).slice(0, 8)) {
    if (!candidates.includes(alt)) candidates.push(alt);
  }

  const file = safe.split('/').pop() ?? '';
  const dir = safe.includes('/') ? safe.slice(0, safe.lastIndexOf('/') + 1) : '';
  for (const variant of dashVariants(file)) {
    const p = `${dir}${variant}`;
    if (!candidates.includes(p)) candidates.push(p);
  }

  // Hard cap — Elementor year/month fan-out used to spawn dozens of 8s fetches.
  const limited = candidates.slice(0, 6);

  for (const candidate of limited) {
    const urls = [encodeWpContentUrl(origin, candidate)];
    if (candidate.startsWith('uploads/uploads/')) {
      urls.push(encodeWpContentUrl(origin, candidate.replace(/^uploads\//, '')));
    }

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'ARGroupMediaProxy/1.0',
            Accept: 'image/*,*/*',
          },
          signal: AbortSignal.timeout(2_500),
          redirect: 'follow',
        });
        if (res.ok && res.body && isImageResponse(res)) return res;
      } catch {
        /* try next candidate */
      }
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  if (!segments?.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const relativePath = segments.map((s) => path.basename(s)).join('/');

  const serveBuffer = (buf: Buffer) =>
    new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': contentTypeFor(relativePath),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  const bundled = await readBundledStatic(relativePath);
  if (bundled) return serveBuffer(bundled);

  // Cap disk alternate probes (full Elementor year/month grid is expensive on miss).
  for (const alt of elementorThumbAlternates(relativePath).slice(0, 12)) {
    const altBundled = await readBundledStatic(alt);
    if (altBundled) return serveBuffer(altBundled);
  }

  const remote = await fetchRemoteWpMedia(relativePath);
  if (remote?.ok && remote.body) {
    const contentType = remote.headers.get('content-type') ?? contentTypeFor(relativePath);
    return new NextResponse(remote.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  }

  return NextResponse.json(
    {
      error: 'Media not found',
      hint: 'Put the file under public/wp-content/ (disk static). Do not set WP_MEDIA_ORIGIN to this site. Only set it to a separate legacy WP/media host if needed.',
    },
    {
      status: 404,
      headers: {
        // Short negative cache so browsers/CDN do not hammer Node on missing media.
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    }
  );
}
