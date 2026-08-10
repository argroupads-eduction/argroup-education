import { prisma, withPrismaRetry } from './prisma';
import { pullPostFromPayloadCms } from './pullPostFromPayloadCms';

const HOSTED_CMS = 'https://argroup-education-cms-livid.vercel.app';

function configuredCmsBase(): string {
  return (
    process.env.PAYLOAD_CMS_URL?.trim().replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_PAYLOAD_URL?.trim().replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_CMS_URL?.trim().replace(/\/$/, '') ||
    HOSTED_CMS
  );
}

function isLocalCmsHost(base: string): boolean {
  try {
    const host = new URL(base).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
}

function isUnreachableCmsError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; code?: string; cause?: { code?: string } };
  if (e.name === 'TimeoutError' || e.name === 'AbortError') return true;
  const code = e.code || e.cause?.code;
  return code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ECONNRESET';
}

type CmsListDoc = {
  slug?: string | null;
  title?: string | null;
  _status?: string | null;
};

let lastReconcileAt = 0;
let inFlight: Promise<{ checked: number; upserted: number }> | null = null;

const THROTTLE_MS = 45_000;

async function fetchRecentPublishedSlugs(
  base: string,
  limit = 20
): Promise<CmsListDoc[]> {
  const url =
    `${base}/api/posts?where[_status][equals]=published` +
    `&limit=${limit}&sort=-publishedAt&depth=0`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    // Keep listing fast when CMS is slow/down — background reconcile only.
    signal: AbortSignal.timeout(3_500),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { docs?: CmsListDoc[] };
  return Array.isArray(json.docs) ? json.docs : [];
}

/** Prefer configured CMS; if local CMS is down, silently use hosted CMS. */
async function loadRecentDocs(limit: number): Promise<CmsListDoc[]> {
  const primary = configuredCmsBase();
  try {
    return await fetchRecentPublishedSlugs(primary, limit);
  } catch (err) {
    if (isLocalCmsHost(primary) && isUnreachableCmsError(err)) {
      try {
        return await fetchRecentPublishedSlugs(HOSTED_CMS, limit);
      } catch {
        return [];
      }
    }
    if (isUnreachableCmsError(err)) return [];
    throw err;
  }
}

async function upsertPulledPost(slug: string): Promise<boolean> {
  const pulled = await pullPostFromPayloadCms(slug);
  if (!pulled || pulled.content.length < 200) return false;

  const publishedAt = pulled.publishedAt ? new Date(pulled.publishedAt) : new Date();
  const data = {
    title: pulled.title,
    slug: pulled.slug,
    content: pulled.content,
    excerpt: pulled.excerpt,
    featuredImage: pulled.featuredImage,
    ogImage: pulled.featuredImage,
    category: 'Blog',
    metaTitle: pulled.metaTitle ?? pulled.title,
    metaDescription: pulled.metaDescription ?? pulled.excerpt.slice(0, 160),
    published: true,
    publishedAt,
  };

  const existing = await withPrismaRetry(() =>
    prisma.blogPost.findUnique({ where: { slug: pulled.slug } })
  );

  if (existing) {
    await withPrismaRetry(() =>
      prisma.blogPost.update({ where: { slug: pulled.slug }, data })
    );
  } else {
    await withPrismaRetry(() => prisma.blogPost.create({ data }));
  }
  return true;
}

/**
 * Pull recent published Payload posts into BlogPost when missing/thin.
 * Throttled so /api/blogs stays fast after the first catch-up.
 * Never throws — offline/slow CMS must not surface Next.js "1 Issue" overlays.
 */
export async function reconcileRecentCmsPosts(options?: {
  force?: boolean;
  limit?: number;
}): Promise<{ checked: number; upserted: number; skipped?: boolean }> {
  // Dev default: Neon list is enough. Background CMS fetch timeouts become Next "1 Issue".
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.CMS_RECONCILE_ON_DEV !== 'true' &&
    options?.force !== true
  ) {
    return { checked: 0, upserted: 0, skipped: true };
  }

  const force = options?.force === true;
  const now = Date.now();
  if (!force && now - lastReconcileAt < THROTTLE_MS) {
    return { checked: 0, upserted: 0, skipped: true };
  }
  if (inFlight) return inFlight;

  lastReconcileAt = now;
  inFlight = (async () => {
    try {
      const docs = await loadRecentDocs(options?.limit ?? 20);
      const slugs = docs
        .map((d) => (typeof d.slug === 'string' ? d.slug.trim() : ''))
        .filter(Boolean);
      if (!slugs.length) return { checked: 0, upserted: 0 };

      const existing = await withPrismaRetry(() =>
        prisma.blogPost.findMany({
          where: { slug: { in: slugs } },
          select: { slug: true, content: true, featuredImage: true },
        })
      );
      const bySlug = new Map(existing.map((row) => [row.slug, row]));

      let upserted = 0;
      for (const slug of slugs) {
        const row = bySlug.get(slug);
        const thin =
          !row ||
          (row.content || '').trim().length < 200 ||
          !row.featuredImage;
        if (!thin) continue;
        try {
          const ok = await upsertPulledPost(slug);
          if (ok) upserted += 1;
        } catch {
          /* per-slug failures stay quiet in background reconcile */
        }
      }

      return { checked: slugs.length, upserted };
    } catch {
      return { checked: 0, upserted: 0 };
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
