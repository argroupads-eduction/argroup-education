import { clamp } from '../interpolation/piecewise';
import { getPrimaryDataset } from '../data/registry';
import { airFromDataset } from './lookup';

export type OfficialNtaOutput = {
  expectedAir: number;
  bestAir: number;
  worstAir: number;
  modelVersion: string;
};

/** NTA official marks-vs-AIR lookup (±5 marks band). */
export function predictOfficialNtaAir(marks: number): OfficialNtaOutput {
  const m = clamp(Math.round(marks), 0, 720);
  const dataset = getPrimaryDataset();
  const expected = airFromDataset(dataset, m);
  const delta = 5;
  const best = Math.max(1, airFromDataset(dataset, Math.min(m + delta, 720)));
  const worst = airFromDataset(dataset, Math.max(m - delta, 0));

  return {
    expectedAir: expected,
    bestAir: Math.min(expected, best),
    worstAir: Math.max(expected, worst),
    modelVersion: 'nta-official-2026',
  };
}
