import { timingSafeEqual } from 'crypto';
import { prisma, withPrismaRetry } from '../lib/prisma';
import { cmsMediaPublicUrl, storeCmsMediaBase64 } from '../lib/cmsMediaStore';
import { pullPostFromPayloadCms } from '../lib/pullPostFromPayloadCms';
import {
  pickFeaturedImage,
  pickRicherSchema,
  pickRicherText,
  resolvePublishedAtForSync,
  stripHtml,
} from '../lib/syncGuard';

function bearerTokenMatches(secret: string, token: string): boolean {
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
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
  /** Strapi Publish attaches Media Library bytes so live does not depend on Hostinger /uploads. */
  featuredImageBase64?: string | null;
  featuredImageMime?: string | null;
  category?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  focusKeyword?: string | null;
  tags?: string[];
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
  /** Preferred date source from Strapi (create-only for publishedAt). */
  legacyPublishedAt?: string | null;
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

function imageOpts() {
  return { publicUrl: process.env.PUBLIC_URL || process.env.STRAPI_PUBLIC_URL || null };
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
  const legacyPublishedAtIn = body.legacyPublishedAt ?? null;

  if (!slug) {
    return { ok: false, status: 400, body: { success: false, message: 'slug is required' } };
  }

  // Strapi Media Library bytes → persistent /api/cms/media/{id} URL on www
  if (typeof body.featuredImageBase64 === 'string' && body.featuredImageBase64.trim()) {
    try {
      const stored = await storeCmsMediaBase64(body.featuredImageBase64, body.featuredImageMime);
      if (stored) {
        featuredImage = cmsMediaPublicUrl(stored.id);
        ogImage = featuredImage;
        console.info('[payload-sync] stored cms media', slug, stored.id, stored.mime);
      }
    } catch (err) {
      console.error('[payload-sync] cms media store failed', slug, err);
    }
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

  try {
    if (type === 'post') {
      const existing = await withPrismaRetry(() =>
        prisma.blogPost.findUnique({ where: { slug } })
      );

      // Unpublish: flag only — NEVER deleteMany
      if (!published) {
        if (existing) {
          await withPrismaRetry(() =>
            prisma.blogPost.update({
              where: { slug },
              data: { published: false },
            })
          );
        }
        return { ok: true, status: 200, body: { success: true, type: 'post', slug, published: false } };
      }

      if (!title && !existing?.title) {
        return { ok: false, status: 400, body: { success: false, message: 'slug and title are required' } };
      }
      title = title || existing!.title;

      // Title-collision cleanup kept for create path only (does not delete by slug)
      if (!existing) {
        await withPrismaRetry(() =>
          prisma.blogPost.deleteMany({
            where: {
              title: { equals: title },
              slug: { not: slug },
            },
          })
        );
      }

      const isNew = !existing;
      const notifyPush = Boolean(body.notifyPush) || isNew;
      const opts = imageOpts();

      const resolvedContent =
        pickRicherText(content, existing?.content, 'html') || title;
      const fallbackExcerpt = stripHtml(resolvedContent).slice(0, 500);
      const resolvedExcerpt =
        pickRicherText(excerptIn, existing?.excerpt, 'html') ||
        (existing?.excerpt ?? fallbackExcerpt);
      const resolvedFeaturedImage = pickFeaturedImage(
        featuredImage,
        existing?.featuredImage,
        opts
      );
      const resolvedOgImage =
        pickFeaturedImage(ogImage, existing?.ogImage, opts) ||
        resolvedFeaturedImage;
      const resolvedMetaTitle =
        pickRicherText(metaTitle, existing?.metaTitle, 'text') || title;
      const resolvedMetaDescription =
        pickRicherText(metaDescription, existing?.metaDescription, 'text') ||
        String(resolvedExcerpt).slice(0, 160);
      const resolvedCanonical = pickRicherText(
        body.canonicalUrl,
        existing?.canonicalUrl,
        'text'
      );
      const resolvedFocus = pickRicherText(
        body.focusKeyword,
        existing?.focusKeyword,
        'text'
      );
      const resolvedOgTitle =
        pickRicherText(body.ogTitle, existing?.ogTitle, 'text') || resolvedMetaTitle;
      const resolvedOgDescription =
        pickRicherText(body.ogDescription, existing?.ogDescription, 'text') ||
        resolvedMetaDescription;
      const resolvedTwTitle =
        pickRicherText(body.twitterTitle, existing?.twitterTitle, 'text') ||
        resolvedOgTitle;
      const resolvedTwDescription =
        pickRicherText(body.twitterDescription, existing?.twitterDescription, 'text') ||
        resolvedOgDescription;
      const resolvedSchema = pickRicherSchema(body.schemaJson, existing?.schemaJson);

      const publishedAt = resolvePublishedAtForSync({
        isNew,
        existingPublishedAt: existing?.publishedAt,
        incomingPublishedAt: publishedAtIn,
        legacyPublishedAt: legacyPublishedAtIn,
        published,
      });

      const data = {
        title,
        slug,
        content: resolvedContent,
        excerpt: resolvedExcerpt,
        featuredImage: resolvedFeaturedImage,
        category: body.category || existing?.category || 'Blog',
        tags: Array.isArray(body.tags) ? body.tags : existing?.tags ?? [],
        metaTitle: resolvedMetaTitle,
        metaDescription: resolvedMetaDescription,
        canonicalUrl: resolvedCanonical,
        focusKeyword: resolvedFocus,
        keywords: Array.isArray(body.keywords)
          ? body.keywords
          : existing?.keywords ?? [],
        ogTitle: resolvedOgTitle,
        ogDescription: resolvedOgDescription,
        ogImage: resolvedOgImage,
        twitterTitle: resolvedTwTitle,
        twitterDescription: resolvedTwDescription,
        ...(resolvedSchema !== undefined ? { schemaJson: resolvedSchema } : {}),
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
          excerpt: resolvedExcerpt,
        },
      };
    }

    // Pages
    const existingPage = await withPrismaRetry(() =>
      prisma.sitePage.findUnique({ where: { slug } })
    );

    if (!published) {
      if (existingPage) {
        await withPrismaRetry(() =>
          prisma.sitePage.update({
            where: { slug },
            data: { published: false },
          })
        );
      }
      return { ok: true, status: 200, body: { success: true, type: 'page', slug, published: false } };
    }

    if (!title && !existingPage?.title) {
      return { ok: false, status: 400, body: { success: false, message: 'slug and title are required' } };
    }
    title = title || existingPage!.title;

    if (!existingPage) {
      await withPrismaRetry(() =>
        prisma.sitePage.deleteMany({
          where: {
            title: { equals: title },
            slug: { not: slug },
          },
        })
      );
    }

    const opts = imageOpts();
    const resolvedContent =
      pickRicherText(content, existingPage?.content, 'html') || title;
    const fallbackExcerpt = stripHtml(resolvedContent).slice(0, 500);
    const excerpt =
      pickRicherText(excerptIn, existingPage?.excerpt, 'html') ||
      (existingPage?.excerpt ?? fallbackExcerpt);
    const resolvedFeaturedImage = pickFeaturedImage(
      featuredImage,
      existingPage?.featuredImage,
      opts
    );
    const resolvedOgImage =
      pickFeaturedImage(ogImage, existingPage?.ogImage, opts) ||
      resolvedFeaturedImage;
    const resolvedMetaTitle =
      pickRicherText(metaTitle, existingPage?.metaTitle, 'text') || title;
    const resolvedMetaDescription =
      pickRicherText(metaDescription, existingPage?.metaDescription, 'text') ||
      String(excerpt).slice(0, 160);
    const resolvedSchema = pickRicherSchema(body.schemaJson, existingPage?.schemaJson);
    const publishedAt = resolvePublishedAtForSync({
      isNew: !existingPage,
      existingPublishedAt: existingPage?.publishedAt,
      incomingPublishedAt: publishedAtIn,
      legacyPublishedAt: legacyPublishedAtIn,
      published,
    });

    const wpId = existingPage?.wpId ?? payloadWpId(slug);
    const pageData = {
      wpId,
      title,
      slug,
      content: resolvedContent,
      excerpt,
      featuredImage: resolvedFeaturedImage,
      metaTitle: resolvedMetaTitle,
      metaDescription: resolvedMetaDescription,
      canonicalUrl: pickRicherText(body.canonicalUrl, existingPage?.canonicalUrl, 'text'),
      focusKeyword: pickRicherText(body.focusKeyword, existingPage?.focusKeyword, 'text'),
      keywords: Array.isArray(body.keywords)
        ? body.keywords
        : existingPage?.keywords ?? [],
      ogTitle:
        pickRicherText(body.ogTitle, existingPage?.ogTitle, 'text') || resolvedMetaTitle,
      ogDescription:
        pickRicherText(body.ogDescription, existingPage?.ogDescription, 'text') ||
        resolvedMetaDescription,
      ogImage: resolvedOgImage,
      twitterTitle:
        pickRicherText(body.twitterTitle, existingPage?.twitterTitle, 'text') ||
        body.ogTitle ||
        resolvedMetaTitle,
      twitterDescription:
        pickRicherText(body.twitterDescription, existingPage?.twitterDescription, 'text') ||
        body.ogDescription ||
        resolvedMetaDescription,
      ...(resolvedSchema !== undefined ? { schemaJson: resolvedSchema } : {}),
      navEnabled: body.navEnabled === true,
      navSection: body.navSection ?? existingPage?.navSection ?? null,
      navParent: body.navParent ?? existingPage?.navParent ?? null,
      navLabel: body.navLabel ?? existingPage?.navLabel ?? null,
      navSortOrder:
        typeof body.navSortOrder === 'number'
          ? body.navSortOrder
          : existingPage?.navSortOrder ?? 0,
      published,
      publishedAt,
    };

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
