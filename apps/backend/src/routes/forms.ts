import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { submitWebsiteLead } from '../handlers/websiteLead';
import { prisma, withPrismaRetry } from '../lib/prisma';

const router = Router();

const PERSON_NAME_REGEX = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;

const personNameValidator = body('name')
  .trim()
  .notEmpty()
  .withMessage('Name is required')
  .matches(PERSON_NAME_REGEX)
  .withMessage('Name can only contain letters (no numbers or special characters).');

// POST /api/forms/counselling - Submit counselling form
router.post(
  '/counselling',
  [
    personNameValidator,
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
        name,
        email,
        phone,
        course,
        neetScore,
        countryPreference,
      } = req.body;

      await submitWebsiteLead({
        source: 'counselling-form',
        formName: 'Counselling enquiry',
        fields: {
          name,
          email,
          phone,
          course,
          neetScore: neetScore ?? '',
          countryPreference,
        },
        pageUrl: typeof req.body.pageUrl === 'string' ? req.body.pageUrl : undefined,
        userAgent: req.get('user-agent') ?? undefined,
      });

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
    personNameValidator,
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

      const { name, email, subject, message, phone } = req.body;

      await submitWebsiteLead({
        source: 'contact-form',
        formName: 'Contact form',
        fields: { name, email, phone: phone ?? '', subject, message },
        pageUrl: typeof req.body.pageUrl === 'string' ? req.body.pageUrl : undefined,
        userAgent: req.get('user-agent') ?? undefined,
      });

      res.json({
        success: true,
        message: 'Thank you for your message. We will get back to you soon.',
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error submitting form' });
    }
  }
);

// POST /api/forms/neet-rank-predictor — NEET rank predictor lead (server-side prediction)
router.post(
  '/neet-rank-predictor',
  [
    personNameValidator,
    body('email').isEmail(),
    body('phone').matches(/^[0-9]{10}$/),
    body('city').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('score').isInt({ min: 0, max: 720 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, email, phone, city, category, score } = req.body;

      const { predictNeetRank } = await import('../lib/neetRankPredictor');
      const cat = String(category) as import('../lib/neetRankPredictor/types').NeetCategory;
      const prediction = predictNeetRank(cat, Number(score));

      await withPrismaRetry(() =>
        prisma.neetRankPredictorSubmission.create({
          data: {
            name,
            email,
            phone,
            city,
            category: cat,
            score: Number(score),
            bestRank: prediction.bestRank,
            expectedRank: prediction.expectedRank,
            worstRank: prediction.worstRank,
            percentile: prediction.percentile,
            collegeChances: prediction.collegeChances,
          },
        })
      );

      await submitWebsiteLead({
        source: 'neet-rank-predictor',
        formName: 'NEET Rank Predictor',
        fields: {
          name,
          email,
          phone,
          city,
          category: cat,
          score,
          bestRank: prediction.bestRank,
          expectedRank: prediction.expectedRank,
          worstRank: prediction.worstRank,
          percentile: prediction.percentileLabel,
          collegeChances: prediction.collegeChances,
        },
        userAgent: req.get('user-agent') ?? undefined,
      });

      res.json({
        success: true,
        prediction,
        message: 'Prediction saved. Our counsellors may reach out to help with admission planning.',
      });
    } catch (error) {
      console.error('[neet-rank-predictor]', error);
      res.status(500).json({ success: false, message: 'Error saving submission' });
    }
  }
);

export default router;
