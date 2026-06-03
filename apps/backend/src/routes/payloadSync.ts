import { Router, Request, Response } from 'express';
import { runPayloadSync, verifyPayloadSyncAuth } from '../handlers/payloadSync';
import { revalidateFrontend } from '../lib/revalidateFrontend';

const router = Router();

router.post('/payload-sync', async (req: Request, res: Response) => {
  const authFail = verifyPayloadSyncAuth(req.headers.authorization ?? null);
  if (authFail) {
    res.status(authFail.status).json(authFail.body);
    return;
  }

  const result = await runPayloadSync(req.body);
  if (result.ok && result.body.published) {
    void revalidateFrontend({
      slug: result.body.slug,
      type: result.body.type,
    });
  }
  res.status(result.status).json(result.body);
});

export default router;
