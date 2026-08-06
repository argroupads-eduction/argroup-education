import { prisma, withPrismaRetry } from './prisma';
import { pullPostFromPayloadCms } from './pullPostFromPayloadCms';

const CMS_BASE =
  process.env.PAYLOAD_CMS_URL?.trim().replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_PAYLOAD_URL?.trim().replace(/\/$/, '') ||
  'https://argroup-education-cms-livid.vercel.app';

type CmsListDoc = {
  slug?: string | null;
  title?: string | null;
  _status?: string | null;
};

let lastReconcileAt = 0;
let inFlight: Promise<{ checked: number; upserted: number }> | null = null;

const THROTTLE_MS = 45_000;

async function fetchRecentPublishedSlugs(limit = 20): Promise<CmsListDoc[]> {
  const url =
    `${CMS_BASE}/api/posts?where[_status][equals]=published` +
    `&limit=${limit}&sort=-publishedAt&depth=0`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    console.error('[cms-reconcile] list failed', res.status);
    return [];
  }
  const json = (await res.json()) as { docs?: CmsListDoc[] };
  return Array.isArray(json.docs) ? json.docs : [];
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
 */
export async function reconcileRecentCmsPosts(options?: {
  force?: boolean;
  limit?: number;
}): Promise<{ checked: number; upserted: number; skipped?: boolean }> {
  const force = options?.force === true;
  const now = Date.now();
  if (!force && now - lastReconcileAt < THROTTLE_MS) {
    return { checked: 0, upserted: 0, skipped: true };
  }
  if (inFlight) return inFlight;

  lastReconcileAt = now;
  inFlight = (async () => {
    try {
      const docs = await fetchRecentPublishedSlugs(options?.limit ?? 20);
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
        } catch (err) {
          console.error('[cms-reconcile] upsert failed', slug, err);
        }
      }

      if (upserted > 0) {
        console.info('[cms-reconcile] upserted', upserted, 'of', slugs.length);
      }
      return { checked: slugs.length, upserted };
    } catch (err) {
      console.error('[cms-reconcile] failed', err);
      return { checked: 0, upserted: 0 };
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
