import { isCollegePopupOpen } from '@/lib/sitePopupCoordination';

/** Opens the global lead-capture popup (desktop modal / mobile sheet). */
export const LEAD_CAPTURE_OPEN_EVENT = 'ar:open-lead-capture';
export const LEAD_CAPTURE_CLOSE_EVENT = 'ar:close-lead-capture';

export function openLeadCapturePopup(): void {
  if (typeof window === 'undefined') return;
  if (isCollegePopupOpen()) return;
  window.dispatchEvent(new CustomEvent(LEAD_CAPTURE_OPEN_EVENT));
}

/** Closes the global lead-capture popup if it is open. */
export function closeLeadCapturePopup(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LEAD_CAPTURE_CLOSE_EVENT));
}
