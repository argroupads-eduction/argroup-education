import { Router, Request, Response } from 'express';
import { runPayloadSync, verifyPayloadSyncAuth } from '../handlers/payloadSync';
import { runGlobalsSync } from '../handlers/globalsSync';
import { revalidateFrontend } from '../lib/revalidateFrontend';

const router = Router();

router.post('/payload-sync', async (req: Request, res: Response) => {
  const authFail = verifyPayloadSyncAuth(req.headers.authorization ?? null);
  if (authFail) {
    res.status(authFail.status).json(authFail.body);
    return;
  }

  const result = await runPayloadSync(req.body);
  // Always bust /blog cache — publish, unpublish, and delete all change the article count.
  if (result.ok && typeof result.body.slug === 'string') {
    void revalidateFrontend({
      slug: result.body.slug,
      type: result.body.type === 'page' ? 'page' : 'post',
    });
  }
  res.status(result.status).json(result.body);
});

router.post('/globals-sync', async (req: Request, res: Response) => {
  const authFail = verifyPayloadSyncAuth(req.headers.authorization ?? null);
  if (authFail) {
    res.status(authFail.status).json(authFail.body);
    return;
  }

  const result = await runGlobalsSync(req.body);
  if (result.ok) {
    void revalidateFrontend({ slug: 'globals', type: 'page' });
  }
  res.status(result.status).json(result.body);
});

export default router;
