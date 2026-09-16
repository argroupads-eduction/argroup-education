/**
 * Public consensus rank model — aligned with coaching portals & ChatGPT-style estimates.
 *
 * Blends:
 * 1. Collegedunia/Shiksha 2026 expected bands (what students Google / ask GPT)
 * 2. Standard coaching heuristic (500 marks ≈ 77,500 rank, power-law scaling)
 * 3. NTA 2025 verified points for top scores (680+)
 */
import { clamp } from '../interpolation/piecewise';
import { airFromDataset } from './lookup';
import { getPrimaryDataset } from '../data/registry';
import {
  airFromCoaching2026,
  coachingBandRange,
  heuristicCoachingAir,
} from '../data/coachingExpected2026';

export type ConsensusOutput = {
  expectedAir: number;
  bestAir: number;
  worstAir: number;
  modelVersion: string;
};

function blend(a: number, b: number, weightA: number): number {
  return Math.round(a * weightA + b * (1 - weightA));
}

export function predictConsensusAir(marks: number): ConsensusOutput {
  const m = clamp(Math.round(marks), 0, 720);
  const primary = getPrimaryDataset();

  const coaching = airFromCoaching2026(m);
  const heuristic = heuristicCoachingAir(m);
  const nta = airFromDataset(primary, m);
  const band = coachingBandRange(m);

  let expected: number;
  let best: number;
  let worst: number;

  if (m >= 620) {
    // Top scores — NTA verified + coaching (GPT matches NTA here)
    expected = blend(nta, coaching, 0.85);
    best = Math.min(expected, airFromDataset(primary, Math.min(m + 5, 720)));
    worst = Math.max(expected, airFromDataset(primary, Math.max(m - 5, 0)));
  } else if (m >= 520) {
    // Upper-mid — mix NTA top points + coaching
    expected = blend(nta, coaching, 0.55);
    best = Math.min(expected, Math.round(expected * 0.92));
    worst = Math.max(expected, Math.round(expected * 1.1));
  } else if (m >= 400) {
    // Mid scores (444, 480, 500) — heuristic + coaching (matches ChatGPT)
    expected = blend(heuristic, coaching, 0.58);
    best = Math.min(expected, band.best, Math.round(heuristic * 0.88));
    worst = Math.max(expected, band.worst, Math.round(heuristic * 1.15));
  } else if (m >= 300) {
    // Low-mid (344) — NTA 2025 + coaching blend (GPT ~2.5L at 344)
    expected = blend(nta, coaching, 0.5);
    best = Math.min(expected, band.best, Math.round(expected * 0.9));
    worst = Math.max(expected, band.worst, Math.round(expected * 1.12));
  } else {
    // Lower scores — coaching bands primary
    expected = blend(coaching, heuristic, 0.15);
    best = Math.min(expected, band.best);
    worst = Math.max(expected, band.worst);
  }

  best = Math.max(1, Math.min(expected, best));
  worst = Math.max(expected, worst);

  return {
    expectedAir: expected,
    bestAir: best,
    worstAir: worst,
    modelVersion: 'coaching-consensus-2026',
  };
}
