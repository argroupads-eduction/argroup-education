import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';

const router = Router();

// POST /api/forms/counselling - Submit counselling form
router.post(
  '/counselling',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email'),
    body('phone').matches(/^[0-9\s\-+()]{10,}$/).withMessage('Invalid phone'),
    body('course').notEmpty().withMessage('Course is required'),
    body('countryPreference').notEmpty().withMessage('Country preference is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        name: _name,
        email: _email,
        phone: _phone,
        course: _course,
        neetScore: _neetScore,
        countryPreference: _countryPreference,
      } = req.body;
      void _name;
      void _email;
      void _phone;
      void _course;
      void _neetScore;
      void _countryPreference;

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

// POST /api/forms/neet-rank-predictor — verified NEET rank predictor lead
router.post(
  '/neet-rank-predictor',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('phone').matches(/^[0-9]{10}$/),
    body('city').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('score').isInt({ min: 0, max: 720 }),
    body('bestRank').isInt({ min: 1 }),
    body('expectedRank').isInt({ min: 1 }),
    body('worstRank').isInt({ min: 1 }),
    body('percentile').isFloat({ min: 0, max: 100 }),
    body('collegeChances').trim().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        name,
        email,
        phone,
        city,
        category,
        score,
        bestRank,
        expectedRank,
        worstRank,
        percentile,
        collegeChances,
      } = req.body;

      await prisma.neetRankPredictorSubmission.create({
        data: {
          name,
          email,
          phone,
          city,
          category,
          score,
          bestRank,
          expectedRank,
          worstRank,
          percentile,
          collegeChances,
        },
      });

      res.json({
        success: true,
        message: 'Prediction saved. Our counsellors may reach out to help with admission planning.',
      });
    } catch (error) {
      console.error('[neet-rank-predictor]', error);
      res.status(500).json({ success: false, message: 'Error saving submission' });
    }
  }
);

export default router;
