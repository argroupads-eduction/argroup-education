import { NEET_2022 } from './years/2022';
import { NEET_2023 } from './years/2023';
import { NEET_2024 } from './years/2024';
import { NEET_2025 } from './years/2025';
import type { NeetYearDataset } from '../types';

export const NEET_DATASETS: NeetYearDataset[] = [NEET_2025, NEET_2024, NEET_2023, NEET_2022];

export const PRIMARY_PREDICTION_YEAR = 2025;

export function getDataset(year: number): NeetYearDataset | undefined {
  return NEET_DATASETS.find((d) => d.year === year);
}

export function getPrimaryDataset(): NeetYearDataset {
  return getDataset(PRIMARY_PREDICTION_YEAR) ?? NEET_2025;
}
