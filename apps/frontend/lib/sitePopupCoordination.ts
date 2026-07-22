/** Shared timing helpers for site popups (lead + college predictor). */

/** Lead enquiry auto-opens shortly after first site load — once per session. */
export const LEAD_POPUP_AUTO_DELAY_MS = 4_000;
export const LEAD_POPUP_SUBMITTED_KEY = 'ar-lead-popup-submitted';
/** Set when user closes the lead popup — blocks auto-reopen for the rest of the session. */
export const LEAD_POPUP_DISMISSED_KEY = 'ar-lead-popup-dismissed';

const LEGACY_DISMISSED_KEY = 'ar-lead-popup-auto-dismissed';
const LEGACY_SESSION_START_KEY = 'ar-lead-popup-session-start';

let leadPopupOpen = false;
let collegePopupOpen = false;

export function setLeadPopupOpen(open: boolean): void {
  leadPopupOpen = open;
}

export function isLeadPopupOpen(): boolean {
  return leadPopupOpen;
}

export function setCollegePopupOpen(open: boolean): void {
  collegePopupOpen = open;
}

export function isCollegePopupOpen(): boolean {
  return collegePopupOpen;
}

/** Kept for older call sites — rank popup is no longer mounted site-wide. */
export function setRankPopupOpen(_open: boolean): void {
  /* no-op */
}

export function isRankPopupOpen(): boolean {
  return false;
}

export function isUserFillingAnyForm(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement;
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return false;
  // Ignore the lead / college popup's own fields — those mean a popup is already open.
  if (el.closest('[data-lead-capture-popup]')) return false;
  if (el.closest('[data-college-predictor-popup]')) return false;
  return Boolean(el.closest('form'));
}

export function markLeadPopupSubmitted(): void {
  try {
    sessionStorage.setItem(LEAD_POPUP_SUBMITTED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function isLeadPopupSubmitted(): boolean {
  try {
    return sessionStorage.getItem(LEAD_POPUP_SUBMITTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markLeadPopupDismissed(): void {
  try {
    sessionStorage.setItem(LEAD_POPUP_DISMISSED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function isLeadPopupDismissed(): boolean {
  try {
    return sessionStorage.getItem(LEAD_POPUP_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

/** True when auto lead popup must not open again this session. */
export function shouldSkipLeadPopupAutoOpen(): boolean {
  return isLeadPopupSubmitted() || isLeadPopupDismissed();
}

/** Removes old session-start keys only — never clears submit/dismiss. */
export function clearLegacyLeadPopupBlocks(): void {
  try {
    sessionStorage.removeItem(LEGACY_DISMISSED_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_START_KEY);
  } catch {
    /* ignore */
  }
}

/** No-op retained for leftover rank-popup imports. */
export function ensureFormInteractionGuard(): void {
  /* no-op */
}
