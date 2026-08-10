import { prisma, withPrismaRetry } from '../lib/prisma';
import { reconcileRecentCmsPosts } from '../lib/reconcileRecentCmsPosts';

function formatBlogListItem(post: {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  category: string;
  publishedAt: Date | null;
  createdAt: Date;
}) {
  const publishedAt = post.publishedAt ?? post.createdAt;
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    category: post.category,
    publishedAt:
      publishedAt instanceof Date ? publishedAt.toISOString() : String(publishedAt),
  };
}

export async function listBlogPosts(page = 1, limit = 10, category?: string) {
  // Never block listing on CMS pull — reconcile in background after response starts.
  // Background only — never console.error (Next.js surfaces that as "1 Issue").
  void reconcileRecentCmsPosts().catch(() => undefined);

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const where = {
    published: true,
    ...(category ? { category } : {}),
  };

  const [items, total] = await withPrismaRetry(() =>
    Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: safeLimit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          category: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      prisma.blogPost.count({ where }),
    ])
  );

  return {
    data: items.map(formatBlogListItem),
    total,
    page: safePage,
    limit: safeLimit,
    pages: Math.ceil(total / safeLimit),
  };
}

/** Fast /blog index: one Neon round-trip for page + sidebar catalog (no CMS wait). */
export async function getBlogIndexListing(opts?: {
  page?: number;
  pageSize?: number;
  catalogSize?: number;
}) {
  void reconcileRecentCmsPosts().catch(() => undefined);

  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts?.pageSize ?? 12));
  const catalogSize = Math.min(500, Math.max(pageSize, opts?.catalogSize ?? 200));
  const skip = (page - 1) * pageSize;

  const where = { published: true };

  const [pageItems, total, catalogItems] = await withPrismaRetry(() =>
    Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          category: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: catalogSize,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          category: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
    ])
  );

  return {
    blogs: pageItems.map(formatBlogListItem),
    catalog: catalogItems.map(formatBlogListItem),
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getBlogPostBySlug(slug: string) {
  const decoded = decodeURIComponent(slug);
  const post = await withPrismaRetry(() =>
    prisma.blogPost.findFirst({
      where: { slug: decoded, published: true },
    })
  );

  const contentLen = (post?.content || '').trim().length;

  // Neon-first: never block opens on CMS. Only await pull when the row is missing.
  if (!post) {
    try {
      const { pullPostFromPayloadCms } = await import('../lib/pullPostFromPayloadCms');
      const pulled = await pullPostFromPayloadCms(decoded);
      if (!pulled || pulled.content.length < 200) return null;
      const publishedAt = pulled.publishedAt ? new Date(pulled.publishedAt) : new Date();
      const data = {
        title: pulled.title,
        slug: pulled.slug,
        content: pulled.content,
        excerpt: pulled.excerpt,
        featuredImage: pulled.featuredImage,
        ogImage: pulled.featuredImage,
        category: 'Blog' as const,
        metaTitle: pulled.metaTitle ?? pulled.title,
        metaDescription: pulled.metaDescription ?? pulled.excerpt.slice(0, 160),
        published: true,
        publishedAt,
      };
      await withPrismaRetry(() => prisma.blogPost.create({ data }));
      const created = await withPrismaRetry(() =>
        prisma.blogPost.findFirst({
          where: { slug: decoded, published: true },
        })
      );
      return created ? formatBlogPostDetail(created) : null;
    } catch {
      return null;
    }
  }

  // Thin rows: repair after response; do not slow the click.
  if (contentLen < 200) {
    void (async () => {
      try {
        const { pullPostFromPayloadCms } = await import('../lib/pullPostFromPayloadCms');
        const pulled = await pullPostFromPayloadCms(decoded);
        if (!pulled || pulled.content.length < 200) return;
        const publishedAt = pulled.publishedAt ? new Date(pulled.publishedAt) : new Date();
        await withPrismaRetry(() =>
          prisma.blogPost.update({
            where: { slug: pulled.slug },
            data: {
              title: pulled.title,
              content: pulled.content,
              excerpt: pulled.excerpt,
              featuredImage: pulled.featuredImage,
              ogImage: pulled.featuredImage,
              metaTitle: pulled.metaTitle ?? pulled.title,
              metaDescription: pulled.metaDescription ?? pulled.excerpt.slice(0, 160),
              published: true,
              publishedAt,
            },
          })
        );
      } catch {
        /* quiet — never surface as Next overlay */
      }
    })();
  }

  return formatBlogPostDetail(post);
}

function formatBlogPostDetail(post: {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  category: string;
  tags: string[];
  author: string;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  keywords: string[];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
}) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    category: post.category,
    tags: post.tags,
    author: post.author,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    canonicalUrl: post.canonicalUrl,
    keywords: post.keywords,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    published: post.published,
  };
}

/** Tiny sidebar query — one findMany, no count/reconcile. */
export async function getLatestBlogSidebar(limit = 8) {
  const take = Math.min(24, Math.max(1, limit));
  const items = await withPrismaRetry(() =>
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        category: true,
        publishedAt: true,
        createdAt: true,
      },
    })
  );
  return items.map(formatBlogListItem);
}

/** Neon-only post + lean sidebar for fast /blog/[slug] opens. */
export async function getBlogPostPageData(slug: string) {
  const [post, latestPosts] = await Promise.all([
    getBlogPostBySlug(slug),
    getLatestBlogSidebar(8),
  ]);
  return { post, latestPosts };
}
