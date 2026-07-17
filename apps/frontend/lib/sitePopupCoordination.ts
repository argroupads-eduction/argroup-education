/** Shared timing helpers for the site lead popup. */

export const LEAD_POPUP_AUTO_DELAY_MS = 4000;
export const LEAD_POPUP_SUBMITTED_KEY = 'ar-lead-popup-submitted';

const LEGACY_DISMISSED_KEY = 'ar-lead-popup-auto-dismissed';
const LEGACY_SESSION_START_KEY = 'ar-lead-popup-session-start';

let leadPopupOpen = false;

export function setLeadPopupOpen(open: boolean): void {
  leadPopupOpen = open;
}

export function isLeadPopupOpen(): boolean {
  return leadPopupOpen;
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
  // Ignore the lead popup's own fields — those mean it is already open.
  if (el.closest('[data-lead-capture-popup]')) return false;
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

/** Removes old dismiss/session keys only — never clears a successful submit. */
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
