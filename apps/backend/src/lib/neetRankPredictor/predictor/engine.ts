import { clamp } from '../interpolation/piecewise';
import { getQualifyingDataset, NEET_DATASETS } from '../data/registry';
import { isOfficialNeet2026ResultsLive } from '../data/predictionMode';
import { percentileFromAir } from '../percentile/calculator';
import { predictWithTrendModel } from '../ai/trendModel';
import { airForYear } from '../analytics/ensemble';
import type { NeetCategory, NeetRankPrediction } from '../types';

const CATEGORY_LABELS: Record<NeetCategory, string> = {
  general_ews: 'General / EWS',
  obc_ncl: 'OBC-NCL',
  sc: 'SC',
  st: 'ST',
  pwd: 'PwD',
};

const RANK_VS_COLLEGE = [
  { maxRank: 100, label: 'AIIMS Delhi, top AIIMS — AIR under 100' },
  { maxRank: 1500, label: 'All AIIMS, JIPMER, CMC Vellore, top government colleges' },
  { maxRank: 11000, label: 'Strong government MBBS, top state quota options' },
  { maxRank: 40000, label: 'Government MBBS via state quota; competitive private options' },
  { maxRank: 70000, label: 'Private MBBS, BDS government seats in select states' },
  { maxRank: 130000, label: 'Private MBBS, BDS, and allied medical courses' },
  { maxRank: Infinity, label: 'BDS, BAMS, BHMS, MBBS abroad and allied programmes' },
] as const;

function collegeChancesForRank(rank: number): string {
  for (const row of RANK_VS_COLLEGE) {
    if (rank <= row.maxRank) return row.label;
  }
  return RANK_VS_COLLEGE[RANK_VS_COLLEGE.length - 1]!.label;
}

function qualifyingNote(category: NeetCategory, score: number): string {
  const qualifying = getQualifyingDataset();
  const min = qualifying.qualifyingMarks[category];
  const label = CATEGORY_LABELS[category];
  if (score >= min) {
    return `Your score meets the NEET ${qualifying.year} qualifying cutoff (${min}+) for ${label}. College admission cutoffs are much higher — use AIR for counselling planning.`;
  }
  return `Score is below the NEET ${qualifying.year} qualifying marks (${min}+) for ${label}. Consider MBBS abroad or allied courses — our counsellors can guide you.`;
}

function dataSourceLabel(): string {
  if (isOfficialNeet2026ResultsLive()) {
    return 'NTA NEET UG 2026 official marks vs rank (re-exam result statistics)';
  }
  return 'NEET 2026 expected rank · consensus mark-band model · coaching-consensus-2026';
}


/**
 * NEET rank predictor — coaching consensus model (Collegedunia / ChatGPT-style estimates).
 * Matches what students see on coaching portals and when asking ChatGPT.
 */
export function predictNeetRank(
  category: NeetCategory,
  score: number,
  targetYear = 2026
): NeetRankPrediction {
  const marks = clamp(Math.round(score), 0, 720);
  const trend = predictWithTrendModel(marks, targetYear);
  const { value: percentile, label: percentileLabel } = percentileFromAir(trend.expectedAir);

  return {
    category,
    categoryLabel: CATEGORY_LABELS[category],
    score: marks,
    bestRank: trend.bestAir,
    expectedRank: trend.expectedAir,
    worstRank: trend.worstAir,
    percentile,
    percentileLabel,
    collegeChances: collegeChancesForRank(trend.expectedAir),
    qualifyingNote: qualifyingNote(category, marks),
    dataYear: 2026,
    dataSource: dataSourceLabel(),
    confidence: trend.confidence,
    referenceYears: NEET_DATASETS.map((d) => d.year),
  };
}

export function formatRank(n: number): string {
  return n.toLocaleString('en-IN');
}

export { predictWithTrendModel, computeYearWeights } from '../ai/trendModel';

export function validatePredictor(scores: number[]): {
  score: number;
  predicted: number;
  ref2025: number;
  errorPct: number;
}[] {
  const ds2025 = NEET_DATASETS.find((d) => d.year === 2025)!;
  return scores.map((score) => {
    const predicted = predictNeetRank('general_ews', score).expectedRank;
    const ref2025 = airForYear(ds2025, score);
    const errorPct =
      ref2025 > 0 ? Math.round((Math.abs(predicted - ref2025) / ref2025) * 10000) / 100 : 0;
    return { score, predicted, ref2025, errorPct };
  });
}
