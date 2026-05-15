import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

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

      // TODO: Save to database via Prisma
      // TODO: Send welcome email

      res.json({
        success: true,
        message: 'Successfully subscribed to newsletter!',
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res
          .status(400)
          .json({ success: false, message: 'Email already subscribed' });
      }
      res.status(500).json({ success: false, message: 'Error subscribing' });
    }
  }
);

export default router;
