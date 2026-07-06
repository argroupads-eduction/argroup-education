/** Shared timing + guards for rank & lead site popups. */

export const LEAD_POPUP_AUTO_DELAY_MS =
  Number(process.env.NEXT_PUBLIC_LEAD_POPUP_DELAY_MS) || 5 * 60 * 1000;

const LEAD_SESSION_START_KEY = 'ar-lead-popup-session-start';
export const LEAD_POPUP_AUTO_DISMISSED_KEY = 'ar-lead-popup-auto-dismissed';
export const LEAD_POPUP_SUBMITTED_KEY = 'ar-lead-popup-submitted';

let rankPopupOpen = false;
let leadPopupOpen = false;
let formFillActive = false;
let formGuardReady = false;
let blurTimer: ReturnType<typeof setTimeout> | null = null;

export function setRankPopupOpen(open: boolean): void {
  rankPopupOpen = open;
}

export function setLeadPopupOpen(open: boolean): void {
  leadPopupOpen = open;
}

export function isRankPopupOpen(): boolean {
  return rankPopupOpen;
}

export function isLeadPopupOpen(): boolean {
  return leadPopupOpen;
}

export function isUserFillingAnyForm(): boolean {
  if (formFillActive) return true;
  const el = document.activeElement;
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return false;
  return Boolean(el.closest('form'));
}

export function shouldDeferLeadAutoOpen(): boolean {
  return isUserFillingAnyForm() || isRankPopupOpen() || isLeadPopupOpen();
}

/** One-time document listeners — safe to call from multiple popups. */
export function ensureFormInteractionGuard(): void {
  if (formGuardReady || typeof document === 'undefined') return;
  formGuardReady = true;

  document.addEventListener(
    'focusin',
    (e) => {
      const target = e.target;
      if (target instanceof HTMLElement && target.closest('form')) {
        formFillActive = true;
        if (blurTimer) {
          clearTimeout(blurTimer);
          blurTimer = null;
        }
      }
    },
    true
  );

  document.addEventListener(
    'focusout',
    () => {
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (!isUserFillingAnyForm()) formFillActive = false;
      }, 500);
    },
    true
  );
}

export function isLeadAutoOpenSuppressedForSession(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return (
      sessionStorage.getItem(LEAD_POPUP_AUTO_DISMISSED_KEY) === '1' ||
      sessionStorage.getItem(LEAD_POPUP_SUBMITTED_KEY) === '1'
    );
  } catch {
    return false;
  }
}

export function markLeadAutoOpenDismissed(): void {
  try {
    sessionStorage.setItem(LEAD_POPUP_AUTO_DISMISSED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function markLeadPopupSubmitted(): void {
  try {
    sessionStorage.setItem(LEAD_POPUP_SUBMITTED_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Ms until lead auto-popup from first visit in this tab session. */
export function msUntilLeadAutoOpen(): number {
  if (typeof window === 'undefined') return LEAD_POPUP_AUTO_DELAY_MS;
  try {
    const now = Date.now();
    const raw = sessionStorage.getItem(LEAD_SESSION_START_KEY);
    if (!raw) {
      sessionStorage.setItem(LEAD_SESSION_START_KEY, String(now));
      return LEAD_POPUP_AUTO_DELAY_MS;
    }
    const start = Number(raw);
    if (!Number.isFinite(start)) {
      sessionStorage.setItem(LEAD_SESSION_START_KEY, String(now));
      return LEAD_POPUP_AUTO_DELAY_MS;
    }
    return Math.max(0, LEAD_POPUP_AUTO_DELAY_MS - (now - start));
  } catch {
    return LEAD_POPUP_AUTO_DELAY_MS;
  }
}

const DEFER_POLL_MS = 2000;
const DEFER_MAX_MS = 15 * 60 * 1000;

/**
 * Run callback when lead popup may open — waits if user is filling a form.
 * Returns cancel function.
 */
export function scheduleLeadAutoOpenWhenSafe(onOpen: () => void): () => void {
  ensureFormInteractionGuard();

  const started = Date.now();
  let mainTimer: ReturnType<typeof setTimeout> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const tryOpen = () => {
    if (isLeadAutoOpenSuppressedForSession()) return;
    if (shouldDeferLeadAutoOpen()) return;
    onOpen();
  };

  const startPolling = () => {
    if (pollTimer) return;
    pollTimer = setInterval(() => {
      if (Date.now() - started > DEFER_MAX_MS) {
        if (pollTimer) clearInterval(pollTimer);
        return;
      }
      if (!shouldDeferLeadAutoOpen()) {
        if (pollTimer) clearInterval(pollTimer);
        tryOpen();
      }
    }, DEFER_POLL_MS);
  };

  mainTimer = setTimeout(() => {
    if (shouldDeferLeadAutoOpen()) {
      startPolling();
      return;
    }
    tryOpen();
  }, msUntilLeadAutoOpen());

  return () => {
    if (mainTimer) clearTimeout(mainTimer);
    if (pollTimer) clearInterval(pollTimer);
  };
}
