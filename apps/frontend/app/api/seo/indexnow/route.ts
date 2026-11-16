import { NextRequest, NextResponse } from 'next/server';
import { buildSitemapEntries } from '@/lib/buildSitemapEntries';
import { notifyIndexNow } from '@/lib/indexNow';
import { getSiteUrl } from '@/lib/siteUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Submit URLs to IndexNow (Bing etc.).
 * Auth: Bearer REVALIDATE_SECRET
 * Body optional: { "urls": ["https://..."] } — if omitted, submits latest sitemap sample (max 200).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ success: false, message: 'Secret not configured' }, { status: 503 });
  }

  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (token !== secret) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  let urls: string[] = [];
  try {
    const body = (await req.json()) as { urls?: string[] };
    if (Array.isArray(body.urls)) {
      urls = body.urls.filter((u) => typeof u === 'string' && u.startsWith('http'));
    }
  } catch {
    /* empty body → use sitemap */
  }

  if (!urls.length) {
    const entries = await buildSitemapEntries(getSiteUrl());
    // Prefer freshest: blogs + hubs first chunk
    urls = entries
      .slice()
      .sort((a, b) => String(b.lastmod).localeCompare(String(a.lastmod)))
      .slice(0, 200)
      .map((e) => e.loc);
  }

  const result = await notifyIndexNow(urls);
  return NextResponse.json({ success: result.ok, ...result, urlCount: urls.length });
}
