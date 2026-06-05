import { MARKS_VS_RANK, NEET_2026_MAX_RANK, RANK_VS_COLLEGE, categoryLabel } from './data';
import type { NeetCategory, NeetRankPrediction } from './types';

const TOTAL_CANDIDATES = 2_400_000;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function findMarksBracket(score: number) {
  const s = clamp(Math.round(score), 0, 720);
  for (const row of MARKS_VS_RANK) {
    if (s >= row.minMarks && s <= row.maxMarks) return { row, score: s };
  }
  return { row: MARKS_VS_RANK[0]!, score: s };
}

function interpolateRank(
  score: number,
  minMarks: number,
  maxMarks: number,
  minRank: number,
  maxRank: number
): number {
  if (maxMarks === minMarks) return Math.round((minRank + maxRank) / 2);
  const t = clamp((score - minMarks) / (maxMarks - minMarks), 0, 1);
  const rank = maxRank - t * (maxRank - minRank);
  return Math.round(clamp(rank, minRank, maxRank));
}

function collegeChancesForRank(rank: number): string {
  for (const row of RANK_VS_COLLEGE) {
    if (rank <= row.maxRank) return row.label;
  }
  return RANK_VS_COLLEGE[RANK_VS_COLLEGE.length - 1]!.label;
}

function percentileFromRank(rank: number): { value: number; label: string } {
  const p = clamp((1 - rank / TOTAL_CANDIDATES) * 100, 0.01, 99.99);
  const rounded = Math.round(p * 100) / 100;
  let label: string;
  if (rounded >= 99.99) label = '99.99+';
  else if (rounded >= 99.9) label = '99.9+';
  else if (rounded >= 99.5) label = '99.5+';
  else if (rounded >= 99) label = '99+';
  else if (rounded >= 95) label = '95+';
  else if (rounded >= 90) label = '90+';
  else label = `${rounded.toFixed(1)}`;
  return { value: rounded, label };
}

function qualifyingNote(category: NeetCategory, score: number): string {
  const hints: Record<NeetCategory, number> = {
    general_ews: 164,
    obc_ncl: 146,
    sc: 129,
    st: 129,
    pwd: 129,
  };
  const min = hints[category];
  if (score >= min) {
    return `Your score meets the indicative qualifying range for ${categoryLabel(category)}. College cutoffs are much higher — use rank vs college analysis for admission planning.`;
  }
  return `Score is below the indicative qualifying marks (${min}+) for ${categoryLabel(category)}. Consider MBBS abroad or allied courses — our counsellors can guide you.`;
}

export function predictNeetRank(category: NeetCategory, score: number): NeetRankPrediction {
  const { row, score: s } = findMarksBracket(score);
  const expectedRank = interpolateRank(s, row.minMarks, row.maxMarks, row.minRank, row.maxRank);
  const span = Math.max(3, Math.round((row.maxRank - row.minRank) * 0.12));
  const bestRank = Math.max(1, expectedRank - span);
  const worstRank = Math.min(NEET_2026_MAX_RANK, expectedRank + span);
  const { value: percentile, label: percentileLabel } = percentileFromRank(expectedRank);

  return {
    category,
    categoryLabel: categoryLabel(category),
    score: s,
    bestRank,
    expectedRank,
    worstRank,
    percentile,
    percentileLabel,
    collegeChances: collegeChancesForRank(expectedRank),
    qualifyingNote: qualifyingNote(category, s),
  };
}

export function formatRank(n: number): string {
  return n.toLocaleString('en-IN');
}
