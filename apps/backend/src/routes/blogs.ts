import { Router, Request, Response } from 'express';
import { getBlogPostBySlug, listBlogPosts } from '../handlers/blogs';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10);
    const limit = parseInt(String(req.query.limit ?? '10'), 10);
    const category = req.query.category as string | undefined;
    const result = await listBlogPosts(page, limit, category);
    res.json(result);
  } catch (error) {
    console.error('GET /api/blogs', error);
    res.status(500).json({ success: false, message: 'Error fetching blogs' });
  }
});

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const post = await getBlogPostBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ success: false, message: 'Blog post not found' });
      return;
    }
    res.json({ success: true, data: post });
  } catch (error) {
    console.error('GET /api/blogs/:slug', error);
    res.status(500).json({ success: false, message: 'Error fetching blog' });
  }
});

export default router;
