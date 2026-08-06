import { timingSafeEqual } from 'crypto';
import { prisma, withPrismaRetry } from '../lib/prisma';
import { pullPostFromPayloadCms } from '../lib/pullPostFromPayloadCms';

function bearerTokenMatches(secret: string, token: string): boolean {
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function payloadWpId(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) | 0;
  }
  return 910_000_000 + (Math.abs(h) % 9_000_000);
}

export type PayloadSyncBody = {
  type?: 'post' | 'page';
  slug?: string;
  title?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string | null;
  category?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  focusKeyword?: string | null;
  keywords?: string[];
  ogTitle?: string | null;
  ogDescription?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  schemaJson?: unknown | null;
  robotsMeta?: string | null;
  navEnabled?: boolean;
  navSection?: string | null;
  navParent?: string | null;
  navLabel?: string | null;
  navSortOrder?: number;
  published?: boolean;
  publishedAt?: string | null;
  /** When true, marketing site should send a Web Push (first publish from Payload). */
  notifyPush?: boolean;
  /**
   * When true (or when push payload is title-only), marketing pulls full Lexical
   * + heroImage from Payload CMS REST so live blogs get real body/images.
   */
  pullFromCms?: boolean;
};

export type PayloadSyncResult =
  | {
      ok: true;
      status: 200;
      body: {
        success: true;
        type: 'post' | 'page';
        slug: string;
        published: boolean;
        isNew?: boolean;
        notifyPush?: boolean;
        title?: string;
        excerpt?: string;
      };
    }
  | { ok: false; status: number; body: { success: false; message: string } };

export function verifyPayloadSyncAuth(authHeader: string | null): PayloadSyncResult | null {
  const candidates = [
    process.env.REVALIDATE_SECRET?.trim().replace(/\r$/, ''),
    process.env.PAYLOAD_SYNC_SECRET?.trim().replace(/\r$/, ''),
  ].filter((s): s is string => Boolean(s));

  if (candidates.length === 0) {
    return {
      ok: false,
      status: 503,
      body: {
        success: false,
        message: 'REVALIDATE_SECRET / PAYLOAD_SYNC_SECRET not configured',
      },
    };
  }

  const header = authHeader ?? '';
  const token = (header.startsWith('Bearer ') ? header.slice(7) : '').trim().replace(/\r$/, '');
  const matched = candidates.some((secret) => bearerTokenMatches(secret, token));
  if (!matched) {
    return { ok: false, status: 401, body: { success: false, message: 'Unauthorized' } };
  }
  return null;
}

export async function runPayloadSync(body: PayloadSyncBody): Promise<PayloadSyncResult> {
  const type = body.type === 'page' ? 'page' : 'post';
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  let title = typeof body.title === 'string' ? body.title.trim() : '';
  let content = typeof body.content === 'string' ? body.content : '';
  let excerptIn = typeof body.excerpt === 'string' ? body.excerpt : undefined;
  let featuredImage = body.featuredImage ?? null;
  let metaTitle = body.metaTitle ?? null;
  let metaDescription = body.metaDescription ?? null;
  let ogImage = body.ogImage ?? null;
  let publishedAtIn = body.publishedAt ?? null;

  if (!slug) {
    return { ok: false, status: 400, body: { success: false, message: 'slug is required' } };
  }

  const published = body.published !== false;

  // Auto-repair: Payload afterChange often pushes title-only while Lexical/media
  // are already available on CMS REST. Pull the real post before writing Neon/Supabase.
  const incomingLooksThin =
    type === 'post' &&
    published &&
    (!content.trim() ||
      content.trim() === title.trim() ||
      content.trim().length < 200 ||
      !featuredImage ||
      body.pullFromCms === true);

  if (incomingLooksThin) {
    try {
      const pulled = await pullPostFromPayloadCms(slug);
      if (pulled) {
        title = title || pulled.title;
        content = pulled.content;
        excerptIn = pulled.excerpt;
        featuredImage = pulled.featuredImage ?? featuredImage;
        metaTitle = metaTitle ?? pulled.metaTitle;
        metaDescription = metaDescription ?? pulled.metaDescription;
        ogImage = ogImage ?? pulled.featuredImage;
        publishedAtIn = publishedAtIn ?? pulled.publishedAt;
        console.info(
          '[payload-sync] pulled from CMS',
          slug,
          'contentLen=',
          content.length,
          'hasImg=',
          Boolean(featuredImage),
        );
      }
    } catch (err) {
      console.error('[payload-sync] CMS pull failed', slug, err);
    }
  }

  if (!title) {
    return { ok: false, status: 400, body: { success: false, message: 'slug and title are required' } };
  }

  const publishedAt = publishedAtIn ? new Date(publishedAtIn) : published ? new Date() : null;
  const excerpt =
    (typeof excerptIn === 'string' && excerptIn.trim()) ||
    stripHtml(content).slice(0, 500);
  const resolvedMetaTitle = metaTitle ?? title;
  const resolvedMetaDescription = metaDescription ?? excerpt.slice(0, 160);

  try {
    if (type === 'post') {
      if (!published) {
        await withPrismaRetry(() =>
          prisma.blogPost.deleteMany({
            where: {
              OR: [{ slug }, { title: { equals: title, mode: 'insensitive' } }],
            },
          })
        );
        return { ok: true, status: 200, body: { success: true, type: 'post', slug, published: false } };
      }

      await withPrismaRetry(() =>
        prisma.blogPost.deleteMany({
          where: {
            title: { equals: title, mode: 'insensitive' },
            slug: { not: slug },
          },
        })
      );

      const existing = await withPrismaRetry(() =>
        prisma.blogPost.findUnique({ where: { slug } })
      );
      const isNew = !existing;
      // Payload first-publish, or brand-new row — both should notify subscribers.
      const notifyPush = Boolean(body.notifyPush) || isNew;

      // Guard: Payload sometimes syncs title-only (empty Lexical / unresolved media).
      // Never wipe a richer live row with a thin payload.
      const incomingContent = (content || excerpt || title).trim();
      const existingContent = (existing?.content || '').trim();
      const stillThinAfterPull =
        incomingContent.length < 200 ||
        incomingContent === title ||
        incomingContent === title.trim();
      const existingLooksRich = existingContent.length > Math.max(incomingContent.length, 200);

      const resolvedContent =
        stillThinAfterPull && existingLooksRich ? existingContent : incomingContent;
      const resolvedExcerpt =
        stillThinAfterPull && existingLooksRich && existing?.excerpt
          ? existing.excerpt
          : excerpt;
      const resolvedFeaturedImage =
        featuredImage ?? existing?.featuredImage ?? null;
      const resolvedOgImage =
        ogImage ?? featuredImage ?? existing?.ogImage ?? resolvedFeaturedImage ?? null;

      const data = {
        title,
        slug,
        content: resolvedContent,
        excerpt: resolvedExcerpt,
        featuredImage: resolvedFeaturedImage,
        category: body.category || 'Blog',
        metaTitle: resolvedMetaTitle,
        metaDescription: resolvedMetaDescription,
        canonicalUrl: body.canonicalUrl ?? null,
        focusKeyword: body.focusKeyword ?? null,
        keywords: Array.isArray(body.keywords) ? body.keywords : [],
        ogTitle: body.ogTitle ?? resolvedMetaTitle,
        ogDescription: body.ogDescription ?? resolvedMetaDescription,
        ogImage: resolvedOgImage,
        twitterTitle: body.twitterTitle ?? body.ogTitle ?? resolvedMetaTitle,
        twitterDescription:
          body.twitterDescription ?? body.ogDescription ?? resolvedMetaDescription,
        schemaJson: body.schemaJson ?? undefined,
        published,
        publishedAt,
      };

      if (existing) {
        await withPrismaRetry(() => prisma.blogPost.update({ where: { slug }, data }));
      } else {
        await withPrismaRetry(() => prisma.blogPost.create({ data }));
      }

      return {
        ok: true,
        status: 200,
        body: {
          success: true,
          type: 'post',
          slug,
          published,
          isNew,
          notifyPush: published && notifyPush,
          title,
          excerpt,
        },
      };
    }

    const wpId = payloadWpId(slug);
    const pageData = {
      wpId,
      title,
      slug,
      content: content || excerpt || title,
      excerpt,
      featuredImage: featuredImage ?? null,
      metaTitle: resolvedMetaTitle,
      metaDescription: resolvedMetaDescription,
      canonicalUrl: body.canonicalUrl ?? null,
      focusKeyword: body.focusKeyword ?? null,
      keywords: Array.isArray(body.keywords) ? body.keywords : [],
      ogTitle: body.ogTitle ?? resolvedMetaTitle,
      ogDescription: body.ogDescription ?? resolvedMetaDescription,
      ogImage: ogImage ?? featuredImage ?? null,
      twitterTitle: body.twitterTitle ?? body.ogTitle ?? resolvedMetaTitle,
      twitterDescription:
        body.twitterDescription ?? body.ogDescription ?? resolvedMetaDescription,
      schemaJson: body.schemaJson ?? undefined,
      navEnabled: body.navEnabled === true,
      navSection: body.navSection ?? null,
      navParent: body.navParent ?? null,
      navLabel: body.navLabel ?? null,
      navSortOrder: typeof body.navSortOrder === 'number' ? body.navSortOrder : 0,
      published,
      publishedAt,
    };

    if (!published) {
      await withPrismaRetry(() =>
        prisma.sitePage.deleteMany({
          where: {
            OR: [{ slug }, { title: { equals: title, mode: 'insensitive' } }],
          },
        })
      );
      return { ok: true, status: 200, body: { success: true, type: 'page', slug, published: false } };
    }

    await withPrismaRetry(() =>
      prisma.sitePage.deleteMany({
        where: {
          title: { equals: title, mode: 'insensitive' },
          slug: { not: slug },
        },
      })
    );

    const existingPage = await withPrismaRetry(() =>
      prisma.sitePage.findUnique({ where: { slug } })
    );

    if (existingPage) {
      await withPrismaRetry(() =>
        prisma.sitePage.update({
          where: { slug },
          data: { ...pageData, wpId: existingPage.wpId },
        })
      );
    } else {
      await withPrismaRetry(() => prisma.sitePage.create({ data: pageData }));
    }

    return { ok: true, status: 200, body: { success: true, type: 'page', slug, published } };
  } catch (error) {
    console.error('payload-sync', error);
    return { ok: false, status: 500, body: { success: false, message: 'Sync failed' } };
  }
}
