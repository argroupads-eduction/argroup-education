import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, pruneRateLimitBuckets } from '@/lib/edgeRateLimit';

const API_LIMIT = parseInt(process.env.RATE_LIMIT_API_MAX || '120', 10);
const API_WINDOW_MS = parseInt(process.env.RATE_LIMIT_API_WINDOW_MS || '60000', 10);

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/')) {
    pruneRateLimitBuckets();
    const ip = clientIp(req);
    const key = `${ip}:${pathname.split('/').slice(0, 4).join('/')}`;
    const { ok, retryAfterSec } = checkRateLimit(key, API_LIMIT, API_WINDOW_MS);

    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'Cache-Control': 'no-store',
          },
        },
      );
    }
  }

  const res = NextResponse.next();

  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};
