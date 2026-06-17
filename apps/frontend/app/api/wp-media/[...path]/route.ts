import path from 'node:path';
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
  const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2018', '2017'];
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  const alts: string[] = [];
  for (const year of years) {
    for (const month of months) {
      alts.push(`uploads/${year}/${month}/${baseFile}`);
    }
  }
  alts.push(`uploads/${baseFile}`);
  return alts;
}

function deploymentOrigin(request: Request): string | null {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  try {
    return new URL(request.url).origin;
  } catch {
    return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || null;
  }
}

/** Fetch bundled media from static /wp-content/ — no fs reads (keeps Vercel function small). */
async function fetchBundledStatic(
  relativePath: string,
  request: Request
): Promise<Buffer | null> {
  const origin = deploymentOrigin(request);
  if (!origin) return null;

  const safe = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const url = encodeWpContentUrl(origin, safe);

  try {
    const res = await fetch(url, {
      headers: { Accept: 'image/*,*/*' },
      signal: AbortSignal.timeout(15_000),
      redirect: 'follow',
      cache: 'force-cache',
    });
    if (!res.ok || !res.body) return null;
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function fetchRemoteWpMedia(relativePath: string): Promise<Response | null> {
  const origin = process.env.WP_MEDIA_ORIGIN?.replace(/\/$/, '');
  if (!origin) return null;

  const safe = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const candidates = new Set<string>();
  candidates.add(safe);
  for (const alt of elementorThumbAlternates(safe)) candidates.add(alt.replace(/^uploads\//, ''));

  const file = safe.split('/').pop() ?? '';
  const dir = safe.includes('/') ? safe.slice(0, safe.lastIndexOf('/') + 1) : '';
  for (const variant of dashVariants(file)) {
    candidates.add(`${dir}${variant}`);
  }

  for (const candidate of candidates) {
    const urls = [encodeWpContentUrl(origin, candidate)];
    if (candidate.startsWith('uploads/')) {
      urls.push(encodeWpContentUrl(origin, candidate.replace(/^uploads\//, '')));
    }

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'ARGroupMediaProxy/1.0',
            Accept: 'image/*,*/*',
          },
          signal: AbortSignal.timeout(20_000),
          redirect: 'follow',
        });
        if (res.ok && res.body) return res;
      } catch {
        /* try next candidate */
      }
    }
  }

  return null;
}

export async function GET(
  request: Request,
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

  const bundled = await fetchBundledStatic(relativePath, request);
  if (bundled) return serveBuffer(bundled);

  for (const alt of elementorThumbAlternates(relativePath)) {
    const altBundled = await fetchBundledStatic(alt, request);
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
      hint: 'Mirror wp-content/uploads to public/wp-content/uploads (npm run wp:setup:uploads), add repo _uploads/, or set WP_MEDIA_ORIGIN.',
    },
    { status: 404 }
  );
}
