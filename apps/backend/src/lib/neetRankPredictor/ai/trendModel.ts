import { clamp } from '../interpolation/piecewise';
import { predictConsensusAir } from '../predictor/consensusModel';
import { isInCoachingBand } from '../data/coachingExpected2026';
import { NTA_2025_BANDS } from '../data/years/2025';

export type TrendModelOutput = {
  expectedAir: number;
  bestAir: number;
  worstAir: number;
  confidence: 'high' | 'medium' | 'low';
  modelVersion: string;
  primaryYear: number;
  yearSpreadPct: number;
};

function isInNta2025Band(marks: number): boolean {
  return NTA_2025_BANDS.some((b) => marks >= b.marksMin && marks <= b.marksMax);
}

/**
 * Predict AIR using coaching-consensus model (matches Collegedunia / ChatGPT-style estimates).
 */
export function predictWithTrendModel(marks: number, _targetYear = 2026): TrendModelOutput {
  const m = clamp(Math.round(marks), 0, 720);
  const consensus = predictConsensusAir(m);

  const spread = consensus.worstAir - consensus.bestAir;
  const yearSpreadPct =
    consensus.expectedAir > 0 ? Math.round((spread / consensus.expectedAir) * 10000) / 100 : 0;

  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (isInCoachingBand(m) || isInNta2025Band(m) || m >= 600) {
    confidence = 'high';
  } else if (yearSpreadPct > 50) {
    confidence = 'low';
  }

  return {
    expectedAir: consensus.expectedAir,
    bestAir: consensus.bestAir,
    worstAir: consensus.worstAir,
    confidence,
    modelVersion: consensus.modelVersion,
    primaryYear: 2026,
    yearSpreadPct,
  };
}

export function computeYearWeights(_targetYear: number): Record<number, number> {
  return { 2026: 1 };
}
