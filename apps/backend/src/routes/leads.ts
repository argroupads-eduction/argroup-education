import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { submitWebsiteLead } from '../handlers/websiteLead';

const router = Router();

router.post(
  '/website-lead',
  [
    body('source').trim().notEmpty().withMessage('source is required'),
    body('fields').isObject().withMessage('fields must be an object'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const result = await submitWebsiteLead({
        source: String(req.body.source),
        formName: typeof req.body.formName === 'string' ? req.body.formName : undefined,
        fields: req.body.fields as Record<string, unknown>,
        pageUrl: typeof req.body.pageUrl === 'string' ? req.body.pageUrl : undefined,
        userAgent: req.get('user-agent') ?? undefined,
      });

      if (!result.ok) {
        return res.status(result.status).json({ success: false, message: result.message });
      }

      return res.status(result.status).json({
        success: true,
        id: result.id,
        emailSent: result.emailSent,
        message: result.message,
      });
    } catch (error) {
      console.error('[website-lead]', error);
      return res.status(500).json({ success: false, message: 'Could not save your enquiry' });
    }
  }
);

export default router;
