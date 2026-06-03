import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

function unauthorized() {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
}

/**
 * On-demand ISR after Payload → backend sync.
 * Set REVALIDATE_SECRET on Vercel; same value on Railway + Payload BACKEND env optional.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { success: false, message: 'REVALIDATE_SECRET not configured' },
      { status: 503 }
    );
  }

  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : req.nextUrl.searchParams.get('secret');
  if (token !== secret) return unauthorized();

  let body: { slug?: string; type?: string; paths?: string[] } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    /* empty body ok */
  }

  const paths = new Set<string>(['/blog', '/']);

  if (Array.isArray(body.paths)) {
    for (const p of body.paths) {
      if (typeof p === 'string' && p.startsWith('/')) paths.add(p);
    }
  }

  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  if (slug) {
    if (body.type === 'post') {
      paths.add(`/blog/${slug}`);
    } else {
      paths.add(`/${slug}`);
    }
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ success: true, revalidated: [...paths] });
}
