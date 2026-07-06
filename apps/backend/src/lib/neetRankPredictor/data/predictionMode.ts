/** NEET UG 2026 re-exam results — auto-switch to NTA official marks-vs-rank (IST). */
export const NEET_EXAM_YEAR = 2026;

/** Default: 20 July 2026, 00:00 IST (NTA re-exam result day). Override via env for testing. */
export function getNeet2026OfficialResultsReleaseDate(): Date {
  const raw = process.env.NEET_2026_RESULTS_RELEASE_DATE?.trim();
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date('2026-07-20T00:00:00+05:30');
}

export type NeetPredictionMode = 'expected' | 'official';

/** True when NTA 2026 official statistics should drive rank lookup. */
export function isOfficialNeet2026ResultsLive(now = new Date()): boolean {
  if (process.env.FORCE_NEET_OFFICIAL_MODE === 'true') return true;
  if (process.env.FORCE_NEET_EXPECTED_MODE === 'true') return false;
  return now.getTime() >= getNeet2026OfficialResultsReleaseDate().getTime();
}

export function getNeetPredictionMode(now = new Date()): NeetPredictionMode {
  return isOfficialNeet2026ResultsLive(now) ? 'official' : 'expected';
}
