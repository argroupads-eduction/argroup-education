/** College Predictor site-wide popup timing & path rules. */

function resolveCollegeAfterLeadMs(): number {
  const raw = process.env.NEXT_PUBLIC_COLLEGE_POPUP_DELAY_MS;
  // Default: 3 minutes after the lead popup opens on a page.
  if (raw === undefined || raw === '') return 3 * 60 * 1000;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 3 * 60 * 1000;
}

/** Wait this long after lead popup opens before showing College Predictor. */
export const COLLEGE_PREDICTOR_POPUP_DELAY_MS = resolveCollegeAfterLeadMs();

export const COLLEGE_PREDICTOR_POPUP_DISMISSED_KEY = 'ar-college-predictor-popup-dismissed';
/** Timestamp (ms) when the current page's lead cycle started — arms the college timer. */
export const COLLEGE_AFTER_LEAD_CLOSE_KEY = 'ar-college-after-lead-close-at';

/** @deprecated kept so old session keys don't break */
export const COLLEGE_PREDICTOR_POPUP_SESSION_START_KEY = 'ar-college-predictor-popup-session-start';

/** Pages where the College Predictor popup should not appear. */
export function isCollegePredictorPopupExcludedPath(pathname: string): boolean {
  return pathname.startsWith('/college-predictor');
}

export function isCollegePredictorPopupDismissed(): boolean {
  try {
    return sessionStorage.getItem(COLLEGE_PREDICTOR_POPUP_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markCollegePredictorPopupDismissed(): void {
  try {
    sessionStorage.setItem(COLLEGE_PREDICTOR_POPUP_DISMISSED_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Allow College Predictor again on the next page/section visit. */
export function clearCollegePredictorPopupDismissed(): void {
  try {
    sessionStorage.removeItem(COLLEGE_PREDICTOR_POPUP_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}

/** Disarm college timer until the next lead open on this page. */
export function clearCollegeSchedule(): void {
  try {
    sessionStorage.removeItem(COLLEGE_AFTER_LEAD_CLOSE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Start / reset the 3‑minute college countdown (call when lead opens, or on page
 * load when lead will not show).
 */
export function armCollegeScheduleFromNow(): void {
  try {
    sessionStorage.setItem(COLLEGE_AFTER_LEAD_CLOSE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** @deprecated alias — prefer armCollegeScheduleFromNow */
export function markLeadClosedForCollegeSchedule(): void {
  armCollegeScheduleFromNow();
}

export function getCollegeScheduleStartedAt(): number | null {
  try {
    const raw = sessionStorage.getItem(COLLEGE_AFTER_LEAD_CLOSE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function isCollegeScheduleArmed(): boolean {
  return getCollegeScheduleStartedAt() != null;
}

/** Ms until college popup may open. `Infinity` if not armed yet. */
export function remainingCollegePopupDelayMs(now = Date.now()): number {
  const startedAt = getCollegeScheduleStartedAt();
  if (startedAt == null) return Number.POSITIVE_INFINITY;
  return Math.max(0, COLLEGE_PREDICTOR_POPUP_DELAY_MS - (now - startedAt));
}
