import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/** Home page WP slug — served at `/`, not `/[slug]`. */
export const WP_HOME_SLUG = 'mbbs-admission-in-top-colleges';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// GET /api/content/:slug — blog post or WP page by root slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const slug = decodeURIComponent(req.params.slug);

    if (slug === WP_HOME_SLUG) {
      res.status(404).json({
        success: false,
        message: 'Home page is served at /',
      });
      return;
    }

    const [post, page] = await Promise.all([
      prisma.blogPost.findFirst({
        where: { slug, published: true },
      }),
      prisma.sitePage.findFirst({
        where: { slug, published: true },
      }),
    ]);

    const doc = post ?? page;
    if (!doc) {
      res.status(404).json({ success: false, message: 'Content not found' });
      return;
    }

    const type = post ? 'post' : 'page';

    res.json({
      success: true,
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
        publishedAt: doc.publishedAt,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (error) {
    console.error('content/:slug', error);
    res.status(500).json({ success: false, message: 'Error fetching content' });
  }
});

export default router;
