import { prisma, withPrismaRetry } from '../lib/prisma';

export const WP_HOME_SLUG = 'mbbs-admission-in-top-colleges';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function getContentBySlug(slug: string) {
  const decoded = decodeURIComponent(slug);

  if (decoded === WP_HOME_SLUG) {
    return { error: 'not_found' as const, message: 'Home page is served at /' };
  }

  const [post, page] = await withPrismaRetry(() =>
    Promise.all([
      prisma.blogPost.findFirst({
        where: { slug: decoded, published: true },
      }),
      prisma.sitePage.findFirst({
        where: { slug: decoded, published: true },
      }),
    ])
  );

  const doc = post ?? page;
  if (!doc) return { error: 'not_found' as const, message: 'Content not found' };

  const type = post ? ('post' as const) : ('page' as const);

  return {
    data: {
      id: doc.id,
      type,
      title: doc.title,
      slug: doc.slug,
      content: doc.content,
      excerpt: doc.excerpt ?? stripHtml(doc.content).slice(0, 280),
      featuredImage: doc.featuredImage,
      metaTitle: doc.metaTitle,
      metaDescription: doc.metaDescription,
      canonicalUrl: doc.canonicalUrl,
      focusKeyword: doc.focusKeyword,
      keywords: doc.keywords,
      ogTitle: doc.ogTitle,
      ogDescription: doc.ogDescription,
      ogImage: doc.ogImage,
      twitterTitle: doc.twitterTitle,
      twitterDescription: doc.twitterDescription,
      schemaJson: doc.schemaJson,
      publishedAt: doc.publishedAt,
      updatedAt: doc.updatedAt,
    },
  };
}

/** True when CMS/DB explicitly removed or unpublished this slug (blocks static bundle fallback). */
export async function isContentSuppressedBySlug(slug: string): Promise<boolean> {
  const decoded = decodeURIComponent(slug);
  const [post, page] = await withPrismaRetry(() =>
    Promise.all([
      prisma.blogPost.findFirst({ where: { slug: decoded }, select: { published: true } }),
      prisma.sitePage.findFirst({ where: { slug: decoded }, select: { published: true } }),
    ])
  );
  const row = post ?? page;
  return row != null && !row.published;
}

export async function getSuppressedBlogSlugs(): Promise<Set<string>> {
  const rows = await withPrismaRetry(() =>
    prisma.blogPost.findMany({
      where: { published: false },
      select: { slug: true },
    })
  );
  return new Set(rows.map((row) => row.slug));
}
