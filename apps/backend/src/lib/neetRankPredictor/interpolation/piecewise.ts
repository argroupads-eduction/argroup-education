/** Log-linear marks → AIR interpolation (NTA standard approach). */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function interpolateAirLog(
  marks: number,
  marksHigh: number,
  marksLow: number,
  airBest: number,
  airWorst: number
): number {
  if (marksHigh === marksLow) return airBest;
  const t = clamp((marksHigh - marks) / (marksHigh - marksLow), 0, 1);
  const logBest = Math.log(Math.max(1, airBest));
  const logWorst = Math.log(Math.max(1, airWorst));
  return Math.round(Math.exp(logBest + t * (logWorst - logBest)));
}

/** AIR from sorted anchor list (marks descending). */
export function airFromAnchors(
  marks: number,
  anchors: readonly { marks: number; air: number }[]
): number {
  if (anchors.length === 0) return 1;
  const m = clamp(Math.round(marks), 0, 720);

  if (m >= anchors[0]!.marks) return anchors[0]!.air;

  const last = anchors[anchors.length - 1]!;
  if (m <= last.marks) return last.air;

  for (let i = 0; i < anchors.length - 1; i++) {
    const hi = anchors[i]!;
    const lo = anchors[i + 1]!;
    if (m <= hi.marks && m >= lo.marks) {
      return interpolateAirLog(m, hi.marks, lo.marks, hi.air, lo.air);
    }
  }

  return last.air;
}
