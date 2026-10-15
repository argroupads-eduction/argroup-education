import { NextRequest, NextResponse } from 'next/server';
import { notifyWordpressPostByRef } from '@/lib/wpBlogPush.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(req: NextRequest) {
  const secret =
    process.env.WP_PUBLISH_SECRET?.trim() ||
    process.env.REVALIDATE_SECRET?.trim() ||
    process.env.PAYLOAD_SYNC_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get('authorization') ?? '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const query = req.nextUrl.searchParams.get('secret')?.trim() || '';
  return bearer === secret || query === secret;
}

function readRef(body: unknown): { slug?: string; id?: number } {
  if (!body || typeof body !== 'object') return {};
  const row = body as Record<string, unknown>;
  const nested =
    row.post && typeof row.post === 'object' ? (row.post as Record<string, unknown>) : row;
  const slugRaw = nested.slug ?? nested.post_name ?? row.slug ?? row.post_name;
  const idRaw = nested.id ?? nested.ID ?? nested.post_id ?? row.id ?? row.post_id;
  const slug = typeof slugRaw === 'string' ? slugRaw.trim() : '';
  const id = typeof idRaw === 'number' ? idRaw : Number(idRaw);
  return {
    slug: slug || undefined,
    id: Number.isFinite(id) && id > 0 ? id : undefined,
  };
}

/**
 * WordPress publish hook.
 * POST /api/wp/published?secret=REVALIDATE_SECRET
 * Body: { "slug": "my-post" } or { "id": 123 }
 */
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const ref = readRef(body);
  if (!ref.slug && !ref.id) {
    return NextResponse.json(
      { success: false, message: 'slug or id is required' },
      { status: 400 }
    );
  }

  try {
    const result = await notifyWordpressPostByRef(ref);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[wp-push] webhook failed', err);
    return NextResponse.json({ success: false, message: 'Notify failed' }, { status: 500 });
  }
}
