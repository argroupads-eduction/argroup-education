import { Router, Request, Response } from 'express';
import { prisma, withPrismaRetry } from '../lib/prisma';

const router = Router();

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function authSync(req: Request, res: Response): boolean {
  const secret = process.env.PAYLOAD_SYNC_SECRET?.trim();
  if (!secret) {
    res.status(503).json({ success: false, message: 'PAYLOAD_SYNC_SECRET not configured on backend' });
    return false;
  }
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token !== secret) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return false;
  }
  return true;
}

/** Stable numeric wpId for Payload-only pages (SitePage requires unique wpId). */
function payloadWpId(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) | 0;
  }
  return 910_000_000 + (Math.abs(h) % 9_000_000);
}

type SyncBody = {
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
  published?: boolean;
  publishedAt?: string | null;
};

// POST /api/cms/payload-sync — Payload CMS → Neon (neondb) for live site without CMS
router.post('/payload-sync', async (req: Request, res: Response) => {
  if (!authSync(req, res)) return;

  try {
    const body = req.body as SyncBody;
    const type = body.type === 'page' ? 'page' : 'post';
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content : '';

    if (!slug || !title) {
      res.status(400).json({ success: false, message: 'slug and title are required' });
      return;
    }

    const published = body.published !== false;
    const publishedAt = body.publishedAt ? new Date(body.publishedAt) : published ? new Date() : null;
    const excerpt =
      (typeof body.excerpt === 'string' && body.excerpt.trim()) ||
      stripHtml(content).slice(0, 500);
    const metaTitle = body.metaTitle ?? title;
    const metaDescription = body.metaDescription ?? excerpt.slice(0, 160);

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
        ogTitle: metaTitle,
        ogDescription: metaDescription,
        ogImage: body.featuredImage ?? null,
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

      res.json({ success: true, type: 'post', slug, published });
      return;
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
      ogTitle: metaTitle,
      ogDescription: metaDescription,
      ogImage: body.featuredImage ?? null,
      keywords: [] as string[],
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

    res.json({ success: true, type: 'page', slug, published });
  } catch (error) {
    console.error('POST /api/cms/payload-sync', error);
    res.status(500).json({ success: false, message: 'Sync failed' });
  }
});

export default router;
