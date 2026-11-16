import type { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { predictNeetRank, validatePredictor } from '../lib/neetRankPredictor';

const NEET_CATEGORIES = ['general_ews', 'obc_ncl', 'sc', 'st', 'pwd'] as const;

export async function handleNeetPredict(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const category = req.body.category as (typeof NEET_CATEGORIES)[number];
  const score = Number(req.body.score);
  const targetYear = req.body.targetYear ? Number(req.body.targetYear) : 2026;

  const prediction = predictNeetRank(category, score, targetYear);

  return res.json({
    success: true,
    prediction,
  });
}

export async function handleNeetValidate(_req: Request, res: Response) {
  const scores = [720, 700, 680, 650, 620, 600, 580, 550, 520, 500, 450, 400, 350, 300, 200, 344];
  const results = validatePredictor(scores);
  const maxError = Math.max(...results.map((r) => r.errorPct));
  return res.json({
    success: true,
    primaryYear: 2025,
    maxErrorPct: maxError,
    results,
  });
}

export const neetPredictValidators = [
  body('score').isInt({ min: 0, max: 720 }),
  body('category').isIn(NEET_CATEGORIES),
  body('targetYear').optional().isInt({ min: 2022, max: 2030 }),
];
