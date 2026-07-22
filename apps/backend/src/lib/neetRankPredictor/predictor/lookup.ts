import { clamp, interpolateAirLog, airFromAnchors } from '../interpolation/piecewise';
import { NTA_2025_BANDS, NTA_2025_TOP_POINTS } from '../data/years/2025';
import { NTA_2026_BANDS, NTA_2026_TOP_POINTS } from '../data/years/2026';
import type { NeetYearDataset } from '../types';

/** Marks at/above this use verified NTA single-score top points. */
const TOP_MARKS_CUTOFF = 516;
/** Highest marks covered by official NTA mark-band tables (must stay continuous with TOP). */
const BANDS_MARKS_CEILING = 509;

type NtaBand = { marksMax: number; marksMin: number; airMin: number; airMax: number };

function airFromNtaBands(
  marks: number,
  topPoints: readonly { marks: number; air: number }[],
  bands: readonly NtaBand[],
  dataset: NeetYearDataset
): number {
  if (!Number.isFinite(marks)) {
    // Invalid input must not collapse to a single sentinel rank for every call.
    return airFromAnchors(0, dataset.anchors);
  }

  const m = clamp(Math.round(marks), 0, 720);

  // Perfect / above published max → AIR 1 (only when maxScore is the true paper max).
  if (m > dataset.maxScore && (dataset.year === 2025 || dataset.year === 2026)) {
    return 1;
  }

  if (m >= TOP_MARKS_CUTOFF) {
    return airFromAnchors(m, topPoints);
  }

  // Bridge the historical gap (510–515) between top-point floor and first band.
  // Old formula interpolated toward 405→199k and made 510 beat 509 (rank inversion).
  if (m > BANDS_MARKS_CEILING && m < TOP_MARKS_CUTOFF) {
    const topFloor = topPoints[topPoints.length - 1]!;
    const firstBand = bands[0]!;
    return interpolateAirLog(
      m,
      TOP_MARKS_CUTOFF,
      BANDS_MARKS_CEILING,
      topFloor.air,
      firstBand.airMin
    );
  }

  for (const band of bands) {
    if (m >= band.marksMin && m <= band.marksMax) {
      return interpolateAirLog(m, band.marksMax, band.marksMin, band.airMin, band.airMax);
    }
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
  const m = Number.isFinite(marks) ? clamp(Math.round(marks), 0, 720) : 0;
  return airFromAnchors(m, dataset.anchors);
}
