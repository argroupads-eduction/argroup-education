import { clamp } from '../interpolation/piecewise';
import { predictConsensusAir } from '../predictor/consensusModel';
import { predictOfficialNtaAir } from '../predictor/officialModel';
import { isInCoachingBand } from '../data/coachingExpected2026';
import { isOfficialNeet2026ResultsLive } from '../data/predictionMode';
import { NTA_2025_BANDS } from '../data/years/2025';
import { NTA_2026_BANDS } from '../data/years/2026';

export type TrendModelOutput = {
  expectedAir: number;
  bestAir: number;
  worstAir: number;
  confidence: 'high' | 'medium' | 'low';
  modelVersion: string;
  primaryYear: number;
  yearSpreadPct: number;
};

function isInNtaBand(
  marks: number,
  bands: readonly { marksMin: number; marksMax: number }[]
): boolean {
  return bands.some((b) => marks >= b.marksMin && marks <= b.marksMax);
}

/**
 * Predict AIR — coaching consensus before NTA 2026 re-exam results;
 * NTA official marks-vs-rank from 20 Jul 2026 (IST) onward.
 * 
 */
export function predictWithTrendModel(marks: number, _targetYear = 2026): TrendModelOutput {
  const m = clamp(Math.round(marks), 0, 720);

  if (isOfficialNeet2026ResultsLive()) {
    const official = predictOfficialNtaAir(m);
    const spread = official.worstAir - official.bestAir;
    const yearSpreadPct =
      official.expectedAir > 0 ? Math.round((spread / official.expectedAir) * 10000) / 100 : 0;

    return {
      expectedAir: official.expectedAir,
      bestAir: official.bestAir,
      worstAir: official.worstAir,
      confidence: isInNtaBand(m, NTA_2026_BANDS) || m >= 600 ? 'high' : 'medium',
      modelVersion: official.modelVersion,
      primaryYear: 2026,
      yearSpreadPct,
    };
  }

  const consensus = predictConsensusAir(m);
  const spread = consensus.worstAir - consensus.bestAir;
  const yearSpreadPct =
    consensus.expectedAir > 0 ? Math.round((spread / consensus.expectedAir) * 10000) / 100 : 0;

  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (isInCoachingBand(m) || isInNtaBand(m, NTA_2025_BANDS) || m >= 600) {
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
