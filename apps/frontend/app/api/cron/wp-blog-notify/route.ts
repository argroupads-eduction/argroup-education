import { NextRequest, NextResponse } from 'next/server';
import { notifyNewWordpressPosts } from '@/lib/wpBlogPush.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Checks WordPress for posts that have not been pushed yet. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim() || process.env.REVALIDATE_SECRET?.trim();
  const auth = req.headers.get('authorization');
  const query = req.nextUrl.searchParams.get('secret')?.trim();
  if (secret && auth !== `Bearer ${secret}` && query !== secret) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await notifyNewWordpressPosts();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron/wp-blog-notify]', err);
    return NextResponse.json({ ok: false, message: 'Notify failed' }, { status: 500 });
  }
}
