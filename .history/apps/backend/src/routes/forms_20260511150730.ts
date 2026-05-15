import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

const router = Router();

// POST /api/forms/counselling - Submit counselling form
router.post(
  '/counselling',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email'),
    body('phone').matches(/^[0-9\s\-\+\(\)]{10,}$/).withMessage('Invalid phone'),
    body('course').notEmpty().withMessage('Course is required'),
    body('countryPreference').notEmpty().withMessage('Country preference is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, email, phone, course, neetScore, countryPreference } = req.body;

      // TODO: Save to database via Prisma
      // TODO: Send confirmation email
      // TODO: Send to WhatsApp

      res.json({
        success: true,
        message: 'Thank you! We will contact you soon.',
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error submitting form' });
    }
  }
);

// POST /api/forms/contact - Submit contact form
router.post(
  '/contact',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // TODO: Save to database via Prisma
      // TODO: Send confirmation email

      res.json({
        success: true,
        message: 'Thank you for your message. We will get back to you soon.',
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error submitting form' });
    }
  }
);

export default router;
