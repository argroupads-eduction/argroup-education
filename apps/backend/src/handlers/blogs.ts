import { prisma, withPrismaRetry } from '../lib/prisma';

export function formatBlogListItem(post: {
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

export async function getBlogPostBySlug(slug: string) {
  const decoded = decodeURIComponent(slug);
  const post = await withPrismaRetry(() =>
    prisma.blogPost.findFirst({
      where: { slug: decoded, published: true },
    })
  );

  if (!post) return null;

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
