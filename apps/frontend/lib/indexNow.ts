import { blogPostPath } from '@/lib/blogUtils';
import { extractHtmlImageUrls } from '@/lib/extractHtmlImageUrls';
import { IMAGE_SITEMAP_PATH } from '@/lib/seoCrawlConfig';
import { getSiteUrl } from '@/lib/siteUrl';
import { toAbsoluteMediaUrl } from '@/lib/toAbsoluteMediaUrl';

/**
 * IndexNow — notify search engines when URLs change (Bing, Yandex, Seznam, Naver).
 * Google mainly discovers via sitemap crawl; IndexNow still helps multi-engine freshness.
 *
 * Key file must be publicly reachable at: {site}/{INDEXNOW_KEY}.txt
 */
export function getIndexNowKey(): string {
  return (
    process.env.INDEXNOW_KEY?.trim() ||
    process.env.NEXT_PUBLIC_INDEXNOW_KEY?.trim() ||
    'argroup-indexnow-7f3c9e2b1d4a8'
  );
}

function siteHostAndOrigin(): { host: string; origin: string } {
  const origin = getSiteUrl().replace(/\/$/, '');
  let host = 'www.argroupofeducation.com';
  try {
    host = new URL(origin).host;
  } catch {
    /* keep default */
  }
  return { host, origin };
}

export function publicUrlForSyncedContent(opts: {
  slug: string;
  type: 'post' | 'page';
}): string {
  const { origin } = siteHostAndOrigin();
  if (opts.type === 'post') {
    return `${origin}${blogPostPath(opts.slug)}`;
  }
  const path =
    opts.slug === 'home' || opts.slug === '/'
      ? '/'
      : `/${opts.slug.split('/').filter(Boolean).map(encodeURIComponent).join('/')}`;
  return path === '/' ? `${origin}/` : `${origin}${path}`;
}

/** Fire-and-forget IndexNow submit. Never throws to callers. */
export async function notifyIndexNow(urls: string[]): Promise<{
  ok: boolean;
  submitted: number;
  status?: number;
  skipped?: boolean;
  reason?: string;
}> {
  const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];
  if (!unique.length) {
    return { ok: false, submitted: 0, skipped: true, reason: 'empty' };
  }

  const key = getIndexNowKey();
  if (!key) {
    return { ok: false, submitted: 0, skipped: true, reason: 'no_key' };
  }

  const { host, origin } = siteHostAndOrigin();
  const keyLocation = `${origin}/${key}.txt`;
  const body = {
    host,
    key,
    keyLocation,
    urlList: unique.slice(0, 10000),
  };

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    // 200 / 202 = accepted; 422 = key mismatch (still log)
    const ok = res.status === 200 || res.status === 202;
    if (!ok) {
      console.warn('[indexnow] submit failed', res.status, await res.text().catch(() => ''));
    } else {
      console.info('[indexnow] submitted', { count: unique.length, status: res.status });
    }
    return { ok, submitted: unique.length, status: res.status };
  } catch (err) {
    console.error('[indexnow] network error', err);
    return { ok: false, submitted: 0, reason: 'network' };
  }
}

/** IndexNow requires URLs on www host — map CMS/WP media to /api/wp-media (working 200). */
function toIndexNowImageUrl(src: string | null | undefined): string | null {
  const abs = toAbsoluteMediaUrl(src);
  if (!abs) return null;
  try {
    const u = new URL(abs);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    let path = u.pathname;
    if (
      (host === 'cms.argroupofeducation.com' || host === 'argroupofeducation.com') &&
      path.includes('/wp-content/')
    ) {
      path = path.replace(/^\/wp-content\//i, '/api/wp-media/');
      return `https://www.argroupofeducation.com${path}${u.search}`;
    }
    if (host === 'argroupofeducation.com') {
      if (path.startsWith('/api/wp-media/') || path.startsWith('/images/') || path.startsWith('/wp-content/uploads/colleges/')) {
        return `https://www.argroupofeducation.com${path}${u.search}`;
      }
      return abs.startsWith('https://www.') ? abs : abs.replace('https://argroupofeducation.com', 'https://www.argroupofeducation.com');
    }
  } catch {
    return null;
  }
  return null;
}

async function collectPublishImageUrls(opts: {
  slug: string;
  type: 'post' | 'page';
}): Promise<string[]> {
  const out: string[] = [];
  const pushAbs = (src: string | null | undefined) => {
    const abs = toIndexNowImageUrl(src);
    if (abs) out.push(abs);
  };

  try {
    if (opts.type === 'post') {
      const { getWpPostBySlug } = await import('@/lib/wpApi');
      const post = await getWpPostBySlug(opts.slug);
      if (post) {
        pushAbs(post.featuredImage);
        for (const src of extractHtmlImageUrls(post.content)) pushAbs(src);
        return out;
      }
    } else {
      const { getWpPageBySlug } = await import('@/lib/wpApi');
      const page = await getWpPageBySlug(opts.slug);
      if (page) {
        pushAbs(page.featuredImage);
        for (const src of extractHtmlImageUrls(page.content)) pushAbs(src);
      }
    }
  } catch {
    /* best-effort */
  }

  return out;
}

/** After WP/Payload publish: page URL + sitemaps + same-origin image URLs for Image Search. */
export async function notifySearchEnginesAfterPublish(opts: {
  slug: string;
  type: 'post' | 'page';
  published: boolean;
  imageUrls?: string[];
}) {
  if (!opts.published) return { ok: false, submitted: 0, skipped: true, reason: 'unpublished' };

  const pageUrl = publicUrlForSyncedContent(opts);
  const { origin } = siteHostAndOrigin();
  const urls = [
    pageUrl,
    `${origin}/sitemap.xml`,
    `${origin}${IMAGE_SITEMAP_PATH}`,
    `${origin}/blog`,
  ];

  const fromOpts = (opts.imageUrls ?? [])
    .map((u) => toIndexNowImageUrl(u))
    .filter((u): u is string => Boolean(u));
  urls.push(...fromOpts);

  const fromWp = await collectPublishImageUrls(opts);
  urls.push(...fromWp);

  return notifyIndexNow(urls);
}
