import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
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

function monorepoUploadsRoot(): string | null {
  const candidates = [
    path.join(process.cwd(), '..', '..', '_uploads'),
    path.join(process.cwd(), '_uploads'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

async function readFileUnderRoot(root: string, relativePath: string): Promise<Buffer | null> {
  const safe = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const filePath = path.resolve(root, safe);
  const resolvedRoot = path.resolve(root);

  if (!filePath.startsWith(resolvedRoot + path.sep) && filePath !== resolvedRoot) {
    return null;
  }

  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

async function readLocalWpMedia(relativePath: string): Promise<Buffer | null> {
  const publicRoot = path.join(process.cwd(), 'public', 'wp-content');
  const fromPublic = await readFileUnderRoot(publicRoot, relativePath);
  if (fromPublic) return fromPublic;

  const uploadsRoot = monorepoUploadsRoot();
  if (!uploadsRoot) return null;

  const safe = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const uploadsRelative = safe.replace(/^uploads\//, '');
  return readFileUnderRoot(uploadsRoot, uploadsRelative);
}

async function fetchRemoteWpMedia(relativePath: string): Promise<Response | null> {
  const origin = process.env.WP_MEDIA_ORIGIN?.replace(/\/$/, '');
  if (!origin) return null;

  const safe = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const candidates = [`${origin}/wp-content/${safe}`, ...elementorThumbAlternates(safe).map((p) => `${origin}/wp-content/${p}`)];

  for (const url of candidates) {
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

  const serveLocal = (buf: Buffer) =>
    new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': contentTypeFor(relativePath),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  const local = await readLocalWpMedia(relativePath);
  if (local) return serveLocal(local);

  for (const alt of elementorThumbAlternates(relativePath)) {
    const altLocal = await readLocalWpMedia(alt);
    if (altLocal) return serveLocal(altLocal);
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
