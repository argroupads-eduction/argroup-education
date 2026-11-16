import { clamp, interpolateAirLog } from '../interpolation/piecewise';

/**
 * NEET 2026 expected marks vs rank — Collegedunia / Shiksha / coaching consensus.
 * Same ranges ChatGPT and coaching sites cite when students ask "what rank for X marks".
 */
export const COACHING_2026_BANDS: readonly {
  marksMax: number;
  marksMin: number;
  airMin: number;
  airMax: number;
}[] = [
  { marksMax: 720, marksMin: 680, airMin: 1, airMax: 500 },
  { marksMax: 679, marksMin: 650, airMin: 500, airMax: 5000 },
  { marksMax: 649, marksMin: 620, airMin: 5000, airMax: 15000 },
  { marksMax: 619, marksMin: 600, airMin: 15000, airMax: 23000 },
  { marksMax: 599, marksMin: 580, airMin: 23000, airMax: 28000 },
  { marksMax: 579, marksMin: 550, airMin: 28000, airMax: 40000 },
  { marksMax: 549, marksMin: 520, airMin: 40000, airMax: 55000 },
  { marksMax: 519, marksMin: 500, airMin: 55000, airMax: 75000 },
  { marksMax: 499, marksMin: 450, airMin: 75000, airMax: 110000 },
  { marksMax: 449, marksMin: 400, airMin: 110000, airMax: 160000 },
  { marksMax: 399, marksMin: 350, airMin: 160000, airMax: 220000 },
  { marksMax: 349, marksMin: 300, airMin: 220000, airMax: 300000 },
  { marksMax: 299, marksMin: 250, airMin: 300000, airMax: 380000 },
  { marksMax: 249, marksMin: 200, airMin: 380000, airMax: 480000 },
  { marksMax: 199, marksMin: 150, airMin: 480000, airMax: 580000 },
  { marksMax: 149, marksMin: 100, airMin: 580000, airMax: 700000 },
  { marksMax: 99, marksMin: 0, airMin: 700000, airMax: 900000 },
];

export function airFromCoaching2026(marks: number): number {
  const m = clamp(Math.round(marks), 0, 720);
  for (const band of COACHING_2026_BANDS) {
    if (m >= band.marksMin && m <= band.marksMax) {
      return interpolateAirLog(m, band.marksMax, band.marksMin, band.airMin, band.airMax);
    }
  }
  return 900000;
}

/** Coaching FAQ baseline: ~500 marks ≈ 77,500 AIR (matches ChatGPT scaling). */
export function heuristicCoachingAir(marks: number): number {
  const m = clamp(Math.round(marks), 1, 720);
  if (m >= 680) return Math.max(1, Math.round(500 * (680 / m)));
  const BASE_MARKS = 500;
  const BASE_RANK = 77500;
  return Math.round(BASE_RANK * Math.pow(BASE_MARKS / m, 1.12));
}

export function coachingBandRange(marks: number): { best: number; worst: number } {
  const m = clamp(Math.round(marks), 0, 720);
  for (const band of COACHING_2026_BANDS) {
    if (m >= band.marksMin && m <= band.marksMax) {
      return { best: band.airMin, worst: band.airMax };
    }
  }
  return { best: 700000, worst: 900000 };
}

export function isInCoachingBand(marks: number): boolean {
  const m = clamp(Math.round(marks), 0, 720);
  return COACHING_2026_BANDS.some((b) => m >= b.marksMin && m <= b.marksMax);
}
