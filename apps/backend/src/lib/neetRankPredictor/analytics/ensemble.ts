import { NEET_DATASETS, getPrimaryDataset } from '../data/registry';
import { airFromDataset } from '../predictor/lookup';

export function airForYear(dataset: (typeof NEET_DATASETS)[number], marks: number): number {
  return airFromDataset(dataset, marks);
}

/** Best / expected / worst AIR — active NTA reference year, ±5 marks band. */
export function ensembleAirRange(marks: number, _targetYear = 2026): {
  expected: number;
  best: number;
  worst: number;
} {
  const primary = getPrimaryDataset();
  const expected = airForYear(primary, marks);

  const delta = 5;
  const best = Math.max(1, airForYear(primary, Math.min(marks + delta, 720)));
  const worst = airForYear(primary, Math.max(marks - delta, 0));

  return {
    expected,
    best: Math.min(expected, best),
    worst: Math.max(expected, worst),
  };
}
