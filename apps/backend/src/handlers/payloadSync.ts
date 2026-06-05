import { timingSafeEqual } from 'crypto';
import { prisma, withPrismaRetry } from '../lib/prisma';

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
};

export type PayloadSyncResult =
  | { ok: true; status: 200; body: { success: true; type: 'post' | 'page'; slug: string; published: boolean } }
  | { ok: false; status: number; body: { success: false; message: string } };

export function verifyPayloadSyncAuth(authHeader: string | null): PayloadSyncResult | null {
  const secret = process.env.PAYLOAD_SYNC_SECRET?.trim();
  if (!secret) {
    return { ok: false, status: 503, body: { success: false, message: 'PAYLOAD_SYNC_SECRET not configured' } };
  }
  const header = authHeader ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!bearerTokenMatches(secret, token)) {
    return { ok: false, status: 401, body: { success: false, message: 'Unauthorized' } };
  }
  return null;
}

export async function runPayloadSync(body: PayloadSyncBody): Promise<PayloadSyncResult> {
  const type = body.type === 'page' ? 'page' : 'post';
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content : '';

  if (!slug || !title) {
    return { ok: false, status: 400, body: { success: false, message: 'slug and title are required' } };
  }

  const published = body.published !== false;
  const publishedAt = body.publishedAt ? new Date(body.publishedAt) : published ? new Date() : null;
  const excerpt =
    (typeof body.excerpt === 'string' && body.excerpt.trim()) ||
    stripHtml(content).slice(0, 500);
  const metaTitle = body.metaTitle ?? title;
  const metaDescription = body.metaDescription ?? excerpt.slice(0, 160);
  const ogImage = body.ogImage ?? body.featuredImage ?? null;

  try {
    if (type === 'post') {
      const data = {
        title,
        slug,
        content: content || excerpt || title,
        excerpt,
        featuredImage: body.featuredImage ?? null,
        category: body.category || 'Blog',
        metaTitle,
        metaDescription,
        canonicalUrl: body.canonicalUrl ?? null,
        focusKeyword: body.focusKeyword ?? null,
        keywords: Array.isArray(body.keywords) ? body.keywords : [],
        ogTitle: body.ogTitle ?? metaTitle,
        ogDescription: body.ogDescription ?? metaDescription,
        ogImage,
        twitterTitle: body.twitterTitle ?? body.ogTitle ?? metaTitle,
        twitterDescription: body.twitterDescription ?? body.ogDescription ?? metaDescription,
        schemaJson: body.schemaJson ?? undefined,
        published,
        publishedAt,
      };

      const existing = await withPrismaRetry(() =>
        prisma.blogPost.findUnique({ where: { slug } })
      );

      if (existing) {
        await withPrismaRetry(() => prisma.blogPost.update({ where: { slug }, data }));
      } else {
        await withPrismaRetry(() => prisma.blogPost.create({ data }));
      }

      return { ok: true, status: 200, body: { success: true, type: 'post', slug, published } };
    }

    const wpId = payloadWpId(slug);
    const pageData = {
      wpId,
      title,
      slug,
      content: content || excerpt || title,
      excerpt,
      featuredImage: body.featuredImage ?? null,
      metaTitle,
      metaDescription,
      canonicalUrl: body.canonicalUrl ?? null,
      focusKeyword: body.focusKeyword ?? null,
      keywords: Array.isArray(body.keywords) ? body.keywords : [],
      ogTitle: body.ogTitle ?? metaTitle,
      ogDescription: body.ogDescription ?? metaDescription,
      ogImage,
      twitterTitle: body.twitterTitle ?? body.ogTitle ?? metaTitle,
      twitterDescription: body.twitterDescription ?? body.ogDescription ?? metaDescription,
      schemaJson: body.schemaJson ?? undefined,
      navEnabled: body.navEnabled === true,
      navSection: body.navSection ?? null,
      navParent: body.navParent ?? null,
      navLabel: body.navLabel ?? null,
      navSortOrder: typeof body.navSortOrder === 'number' ? body.navSortOrder : 0,
      published,
      publishedAt,
    };

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
