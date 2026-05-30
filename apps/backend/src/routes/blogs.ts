import { Router, Request, Response } from 'express';
import { prisma, withPrismaRetry } from '../lib/prisma';

const router = Router();

function formatPost(post: {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  category: string;
  publishedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    category: post.category,
    publishedAt: post.publishedAt ?? post.createdAt,
  };
}

// GET /api/blogs — published posts (newest first)
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '10'), 10)));
    const skip = (page - 1) * limit;
    const category = req.query.category as string | undefined;

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
          take: limit,
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

    res.json({
      data: items.map(formatPost),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET /api/blogs', error);
    res.status(500).json({ success: false, message: 'Error fetching blogs' });
  }
});

// GET /api/blogs/:slug — single post
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const slug = decodeURIComponent(req.params.slug);

    const post = await withPrismaRetry(() =>
      prisma.blogPost.findFirst({
        where: { slug, published: true },
      })
    );

    if (!post) {
      res.status(404).json({ success: false, message: 'Blog post not found' });
      return;
    }

    res.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    console.error('GET /api/blogs/:slug', error);
    res.status(500).json({ success: false, message: 'Error fetching blog' });
  }
});

export default router;
