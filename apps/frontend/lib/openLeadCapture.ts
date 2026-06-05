/** Opens the global lead-capture popup (desktop modal / mobile sheet). */
export const LEAD_CAPTURE_OPEN_EVENT = 'ar:open-lead-capture';

export function openLeadCapturePopup(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LEAD_CAPTURE_OPEN_EVENT));
}
