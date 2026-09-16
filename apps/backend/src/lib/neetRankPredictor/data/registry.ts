import { NEET_2022 } from './years/2022';
import { NEET_2023 } from './years/2023';
import { NEET_2024 } from './years/2024';
import { NEET_2025 } from './years/2025';
import { NEET_2026 } from './years/2026';
import { isOfficialNeet2026ResultsLive } from './predictionMode';
import type { NeetYearDataset } from '../types';

export { NEET_EXAM_YEAR as EXAM_YEAR, getNeetPredictionMode, isOfficialNeet2026ResultsLive } from './predictionMode';

export const NEET_DATASETS: NeetYearDataset[] = [
  NEET_2026,
  NEET_2025,
  NEET_2024,
  NEET_2023,
  NEET_2022,
];

/** Exam year shown in UI and qualifying cutoffs (always NEET 2026). */
export function getQualifyingDataset(): NeetYearDataset {
  return NEET_2026;
}

/** NTA dataset used for rank lookup — 2026 official after result release, else 2025 reference blend. */
export function getPrimaryDataset(): NeetYearDataset {
  return isOfficialNeet2026ResultsLive() ? NEET_2026 : NEET_2025;
}

export function getDataset(year: number): NeetYearDataset | undefined {
  return NEET_DATASETS.find((d) => d.year === year);
}
