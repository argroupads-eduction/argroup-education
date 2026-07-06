import { clamp, interpolateAirLog, airFromAnchors } from '../interpolation/piecewise';
import { NTA_2025_BANDS, NTA_2025_TOP_POINTS } from '../data/years/2025';
import { NTA_2026_BANDS, NTA_2026_TOP_POINTS } from '../data/years/2026';
import type { NeetYearDataset } from '../types';

const TOP_MARKS_CUTOFF = 516;

type NtaBand = { marksMax: number; marksMin: number; airMin: number; airMax: number };

function airFromNtaBands(
  marks: number,
  topPoints: readonly { marks: number; air: number }[],
  bands: readonly NtaBand[],
  dataset: NeetYearDataset
): number {
  const m = clamp(Math.round(marks), 0, 720);

  if (m > dataset.maxScore && (dataset.year === 2025 || dataset.year === 2026)) {
    return 1;
  }

  if (m >= TOP_MARKS_CUTOFF) {
    return airFromAnchors(m, topPoints);
  }

  for (const band of bands) {
    if (m >= band.marksMin && m <= band.marksMax) {
      return interpolateAirLog(m, band.marksMax, band.marksMin, band.airMin, band.airMax);
    }
  }

  if (m > 405 && m < TOP_MARKS_CUTOFF) {
    return interpolateAirLog(m, TOP_MARKS_CUTOFF, 405, 35000, 199_000);
  }

  return airFromAnchors(m, dataset.anchors);
}

/**
 * NTA marks vs AIR lookup (verified points + official mark-band statistics).
 */
export function airFromDataset(dataset: NeetYearDataset, marks: number): number {
  if (dataset.year === 2026) {
    return airFromNtaBands(marks, NTA_2026_TOP_POINTS, NTA_2026_BANDS, dataset);
  }
  if (dataset.year === 2025) {
    return airFromNtaBands(marks, NTA_2025_TOP_POINTS, NTA_2025_BANDS, dataset);
  }
  return airFromAnchors(clamp(Math.round(marks), 0, 720), dataset.anchors);
}
