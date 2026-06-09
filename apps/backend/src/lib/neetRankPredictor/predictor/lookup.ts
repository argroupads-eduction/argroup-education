import { clamp, interpolateAirLog, airFromAnchors } from '../interpolation/piecewise';
import { NTA_2025_BANDS, NTA_2025_TOP_POINTS } from '../data/years/2025';
import type { NeetYearDataset } from '../types';

const TOP_MARKS_CUTOFF = 516;

/**
 * NTA 2025 AIR lookup:
 * - marks ≥ 516 → verified NTA point anchors (PW/NTA PDF)
 * - marks 144–515 → NTA official mark-band statistics
 * - gap 405–515 → log interpolate between point 516/35000 and 405/199000 if no band match
 */
export function airFromDataset(dataset: NeetYearDataset, marks: number): number {
  const m = clamp(Math.round(marks), 0, 720);

  if (m > dataset.maxScore && dataset.year === 2025) {
    return 1;
  }

  if (dataset.year === 2025) {
    if (m >= TOP_MARKS_CUTOFF) {
      return airFromAnchors(m, NTA_2025_TOP_POINTS);
    }

    for (const band of NTA_2025_BANDS) {
      if (m >= band.marksMin && m <= band.marksMax) {
        return interpolateAirLog(m, band.marksMax, band.marksMin, band.airMin, band.airMax);
      }
    }

    // Bridge 405–515 between verified NTA points (516→35000, 405→199000)
    if (m > 405 && m < TOP_MARKS_CUTOFF) {
      return interpolateAirLog(m, TOP_MARKS_CUTOFF, 405, 35000, 199_000);
    }

    return airFromAnchors(m, dataset.anchors);
  }

  return airFromAnchors(m, dataset.anchors);
}
