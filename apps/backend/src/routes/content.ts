import { Router, Request, Response } from 'express';
import { getContentBySlug } from '../handlers/content';

export { WP_HOME_SLUG } from '../handlers/content';

const router = Router();

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const result = await getContentBySlug(req.params.slug);
    if ('error' in result) {
      res.status(404).json({ success: false, message: result.message });
      return;
    }
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('content/:slug', error);
    res.status(500).json({ success: false, message: 'Error fetching content' });
  }
});

export default router;
