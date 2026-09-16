import { prisma, withPrismaRetry } from '../lib/prisma';
import { asStringArray } from '../lib/jsonArray';
import { reconcileRecentCmsPosts } from '../lib/reconcileRecentCmsPosts';
import { isDatabaseUnavailableError } from '../lib/neonDatabaseUrl';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

type BlogListItem = ReturnType<typeof formatBlogListItem>;

type BlogDetailFallback = ReturnType<typeof formatBlogPostDetail>;

let blogDetailFallbackCache: BlogDetailFallback[] | null = null;

function loadBlogIndexFallback(): BlogListItem[] {
  const candidates = [
    path.join(process.cwd(), 'data', 'blog-index-fallback.json'),
    path.join(process.cwd(), 'apps', 'frontend', 'data', 'blog-index-fallback.json'),
    path.join(__dirname, '../../../frontend/data/blog-index-fallback.json'),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      const raw = JSON.parse(readFileSync(file, 'utf8')) as {
        posts?: BlogListItem[];
      };
      if (Array.isArray(raw.posts) && raw.posts.length > 0) return raw.posts;
    } catch {
      /* try next */
    }
  }
  return [];
}

function loadBlogDetailFallback(): BlogDetailFallback[] {
  if (blogDetailFallbackCache) return blogDetailFallbackCache;
  const candidates = [
    path.join(process.cwd(), 'data', 'blog-detail-fallback.json'),
    path.join(process.cwd(), 'apps', 'frontend', 'data', 'blog-detail-fallback.json'),
    path.join(__dirname, '../../../frontend/data/blog-detail-fallback.json'),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      const raw = JSON.parse(readFileSync(file, 'utf8')) as {
        posts?: Array<{
          id: string;
          title: string;
          slug: string;
          content: string;
          excerpt: string;
          featuredImage: string | null;
          category: string;
          tags: unknown;
          author: string;
          metaTitle: string | null;
          metaDescription: string | null;
          canonicalUrl: string | null;
          keywords: unknown;
          schemaJson?: unknown | null;
          publishedAt: string;
          createdAt: string;
          updatedAt: string;
          published: boolean;
        }>;
      };
      if (!Array.isArray(raw.posts) || raw.posts.length === 0) continue;
      blogDetailFallbackCache = raw.posts.map((post) =>
        formatBlogPostDetail({
          ...post,
          publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
          createdAt: new Date(post.createdAt),
          updatedAt: new Date(post.updatedAt),
        })
      );
      return blogDetailFallbackCache;
    } catch {
      /* try next */
    }
  }
  blogDetailFallbackCache = [];
  return blogDetailFallbackCache;
}

function getFallbackPostBySlug(slug: string): BlogDetailFallback | null {
  const found = loadBlogDetailFallback().find((p) => p.slug === slug);
  return found ?? null;
}

function paginateFallback(
  all: BlogListItem[],
  opts: { page: number; pageSize: number; catalogSize: number; excludeSlugs: string[] }
) {
  const filtered = opts.excludeSlugs.length
    ? all.filter((p) => !opts.excludeSlugs.includes(p.slug))
    : all;
  const total = filtered.length;
  const skip = (opts.page - 1) * opts.pageSize;
  return {
    blogs: filtered.slice(skip, skip + opts.pageSize),
    catalog: filtered.slice(0, opts.catalogSize),
    total,
    page: opts.page,
    pageSize: opts.pageSize,
    pages: Math.max(1, Math.ceil(total / opts.pageSize) || 1),
  };
}

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

  try {
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
  } catch (err) {
    if (!isDatabaseUnavailableError(err) && process.env.NODE_ENV === 'production') {
      // Still fall back — Amplify often surfaces provider mismatch as generic errors.
    }
    let all = loadBlogIndexFallback();
    if (category) all = all.filter((p) => p.category === category);
    const total = all.length;
    return {
      data: all.slice(skip, skip + safeLimit),
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.max(1, Math.ceil(total / safeLimit) || 1),
    };
  }
}

/** Fast /blog index: one Neon round-trip for page + sidebar catalog (no CMS wait). */
export async function getBlogIndexListing(opts?: {
  page?: number;
  pageSize?: number;
  catalogSize?: number;
  /** Slugs hidden from the public blog index (duplicates / takedowns). */
  excludeSlugs?: string[];
}) {
  void reconcileRecentCmsPosts().catch(() => undefined);

  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts?.pageSize ?? 12));
  const catalogSize = Math.min(500, Math.max(pageSize, opts?.catalogSize ?? 200));
  const skip = (page - 1) * pageSize;
  const excludeSlugs = (opts?.excludeSlugs ?? []).filter(Boolean);

  const where = {
    published: true,
    ...(excludeSlugs.length > 0 ? { slug: { notIn: excludeSlugs } } : {}),
  };

  try {
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
  } catch {
    return paginateFallback(loadBlogIndexFallback(), {
      page,
      pageSize,
      catalogSize,
      excludeSlugs,
    });
  }
}

export async function getBlogPostBySlug(slug: string) {
  const decoded = decodeURIComponent(slug);

  let post: Awaited<ReturnType<typeof prisma.blogPost.findFirst>> = null;
  let dbUnavailable = false;
  try {
    post = await withPrismaRetry(() =>
      prisma.blogPost.findFirst({
        where: { slug: decoded, published: true },
      })
    );
  } catch {
    dbUnavailable = true;
  }

  const contentLen = (post?.content || '').trim().length;

  // Neon-first: never block opens on CMS. Only await pull when the row is missing.
  if (!post && !dbUnavailable) {
    try {
      const { pullPostFromPayloadCms } = await import('../lib/pullPostFromPayloadCms');
      const pulled = await pullPostFromPayloadCms(decoded);
      if (!pulled || pulled.content.length < 200) {
        return getFallbackPostBySlug(decoded);
      }
      const publishedAt = pulled.publishedAt ? new Date(pulled.publishedAt) : new Date();
      const data = {
        title: pulled.title,
        slug: pulled.slug,
        content: pulled.content,
        excerpt: pulled.excerpt,
        featuredImage: pulled.featuredImage,
        ogImage: pulled.featuredImage,
        category: 'Blog' as const,
        tags: [] as string[],
        keywords: [] as string[],
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
      return created ? formatBlogPostDetail(created) : getFallbackPostBySlug(decoded);
    } catch {
      return getFallbackPostBySlug(decoded);
    }
  }

  if (!post) {
    return getFallbackPostBySlug(decoded);
  }

  // Thin rows: repair after response; do not slow the click.
  if (contentLen < 200) {
    const fallback = getFallbackPostBySlug(decoded);
    if (fallback && (fallback.content || '').trim().length >= 200) {
      void (async () => {
        try {
          await withPrismaRetry(() =>
            prisma.blogPost.update({
              where: { slug: decoded },
              data: {
                title: fallback.title,
                content: fallback.content,
                excerpt: fallback.excerpt,
                featuredImage: fallback.featuredImage,
                ogImage: fallback.featuredImage,
                metaTitle: fallback.metaTitle ?? fallback.title,
                metaDescription: fallback.metaDescription ?? fallback.excerpt.slice(0, 160),
                published: true,
              },
            })
          );
        } catch {
          /* quiet */
        }
      })();
      return fallback;
    }

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
  tags: unknown;
  author: string;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  keywords: unknown;
  schemaJson?: unknown | null;
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
    tags: asStringArray(post.tags),
    author: post.author,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    canonicalUrl: post.canonicalUrl,
    keywords: asStringArray(post.keywords),
    schemaJson: post.schemaJson ?? null,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    published: post.published,
  };
}

/** Tiny sidebar query — one findMany, no count/reconcile. */
export async function getLatestBlogSidebar(limit = 8) {
  const take = Math.min(24, Math.max(1, limit));
  try {
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
  } catch {
    return loadBlogIndexFallback().slice(0, take);
  }
}

/** Neon-only post + lean sidebar for fast /blog/[slug] opens. */
export async function getBlogPostPageData(slug: string) {
  const [post, latestPosts] = await Promise.all([
    getBlogPostBySlug(slug),
    getLatestBlogSidebar(8),
  ]);
  return { post, latestPosts };
}
