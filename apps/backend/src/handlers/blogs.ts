import { prisma, withPrismaRetry } from '../lib/prisma';
import { reconcileRecentCmsPosts } from '../lib/reconcileRecentCmsPosts';

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
  // Catch Payload publishes that never reached Neon (failed CMS→marketing sync).
  try {
    await reconcileRecentCmsPosts();
  } catch (err) {
    console.error('[listBlogPosts] cms reconcile skipped', err);
  }

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
  let post = await withPrismaRetry(() =>
    prisma.blogPost.findFirst({
      where: { slug: decoded, published: true },
    })
  );

  // Direct URL visit before list reconcile — pull this slug from CMS once.
  if (!post || (post.content || '').trim().length < 200 || !post.featuredImage) {
    try {
      const { pullPostFromPayloadCms } = await import('../lib/pullPostFromPayloadCms');
      const pulled = await pullPostFromPayloadCms(decoded);
      if (pulled && pulled.content.length >= 200) {
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
        if (post) {
          await withPrismaRetry(() =>
            prisma.blogPost.update({ where: { slug: pulled.slug }, data })
          );
        } else {
          await withPrismaRetry(() => prisma.blogPost.create({ data }));
        }
        post = await withPrismaRetry(() =>
          prisma.blogPost.findFirst({
            where: { slug: decoded, published: true },
          })
        );
      }
    } catch (err) {
      console.error('[getBlogPostBySlug] cms pull failed', decoded, err);
    }
  }

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
