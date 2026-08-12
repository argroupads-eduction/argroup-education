import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, pruneRateLimitBuckets } from '@/lib/edgeRateLimit';
import { resolveInternalPath } from '@/lib/rewriteInternalLinks';
import { resolveSlugAlias } from '@/lib/wpSlugAliases';

const API_LIMIT = parseInt(process.env.RATE_LIMIT_API_MAX || '120', 10);
const API_WINDOW_MS = parseInt(process.env.RATE_LIMIT_API_WINDOW_MS || '60000', 10);

/** Read-heavy routes polled by the homepage — skip edge rate limit to avoid 429 noise on Amplify. */
const RATE_LIMIT_SKIP_PREFIXES = [
  '/api/health',
  '/api/youtube/videos',
  '/api/google-reviews',
  '/api/wp-media/',
  '/api/public-asset/',
] as const;

function isRateLimitSkipped(pathname: string): boolean {
  return RATE_LIMIT_SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed || '/';
}

function pathsMatch(a: string, b: string): boolean {
  return normalizePathname(a) === normalizePathname(b);
}

/** Program hub index routes — never run legacy WP slug redirects (prevents redirect loops). */
const PROGRAM_HUB_PATHS = new Set(['/mbbs-india', '/mbbs-abroad', '/md-ms']);

function legacyWpRedirect(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  const normalizedCurrent = normalizePathname(pathname);

  if (PROGRAM_HUB_PATHS.has(normalizedCurrent)) {
    return null;
  }

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/blog/') ||
    pathname.startsWith('/mbbs-india/') ||
    pathname.startsWith('/mbbs-abroad/') ||
    pathname.startsWith('/md-ms/') ||
    normalizedCurrent === '/mbbs-india' ||
    normalizedCurrent === '/mbbs-abroad' ||
    normalizedCurrent === '/md-ms' ||
    normalizedCurrent === '/' ||
    pathname.includes('.')
  ) {
    return null;
  }

  const slugPath = pathname.replace(/^\/+|\/+$/g, '');
  if (!slugPath) return null;

  const alias = resolveSlugAlias(slugPath);
  if (alias && !pathsMatch(alias, normalizedCurrent)) {
    const url = req.nextUrl.clone();
    url.pathname = alias;
    return NextResponse.redirect(url, 308);
  }

  const target = resolveInternalPath(slugPath);
  if (!pathsMatch(target, normalizedCurrent)) {
    const url = req.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 308);
  }

  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Apex → www (301). Prefer Amplify Console rule too so CloudFront never serves mixed hosts.
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    .split(',')[0]
    ?.trim()
    .split(':')[0]
    ?.toLowerCase();
  if (host === 'argroupofeducation.com') {
    const dest = new URL(req.url);
    dest.protocol = 'https:';
    dest.host = 'www.argroupofeducation.com';
    return NextResponse.redirect(dest, 301);
  }

  const legacy = legacyWpRedirect(req);
  if (legacy) return legacy;

  if (pathname.startsWith('/api/') && !isRateLimitSkipped(pathname)) {
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
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
