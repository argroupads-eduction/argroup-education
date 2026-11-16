import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { submitWebsiteLead } from '../handlers/websiteLead';
import { prisma, withPrismaRetry } from '../lib/prisma';

const router = Router();

// POST /api/newsletter/subscribe - Subscribe to newsletter
router.post(
  '/subscribe',
  [body('email').isEmail().withMessage('Invalid email')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email } = req.body;

      await withPrismaRetry(() =>
        prisma.subscriber.upsert({
          where: { email },
          create: { email },
          update: { active: true, unsubscribedAt: null },
        })
      );

      await submitWebsiteLead({
        source: 'newsletter',
        formName: 'Newsletter subscription',
        fields: { email },
        pageUrl: typeof req.body.pageUrl === 'string' ? req.body.pageUrl : undefined,
        userAgent: req.get('user-agent') ?? undefined,
      });

      res.json({
        success: true,
        message: 'Successfully subscribed to newsletter!',
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Email already subscribed' });
      }
      res.status(500).json({ success: false, message: 'Error subscribing' });
    }
  }
);

export default router;
