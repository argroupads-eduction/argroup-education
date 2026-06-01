import {
  markCounsellingSubmitted,
  THANK_YOU_PATH,
  type CounsellingSubmitSession,
} from '@/lib/counsellingFormSession';

export function getThankYouUrl(path: string = THANK_YOU_PATH): string {
  if (typeof window === 'undefined') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${normalized}`;
}

/**
 * Open thank-you in a new tab (or same tab if popups blocked).
 * Call synchronously in the submit handler — do NOT await before this.
 */
export function openThankYouInNewTab(
  data: Omit<CounsellingSubmitSession, 'at'>,
  path: string = THANK_YOU_PATH
): void {
  if (typeof window === 'undefined') return;

  markCounsellingSubmitted(data);
  const url = getThankYouUrl(path);

  const tab = window.open(url, '_blank');
  if (tab) {
    tab.focus();
    return;
  }

  window.location.assign(url);
}

/** @deprecated Use openThankYouInNewTab — about:blank redirect fails in Edge. */
export function prepareThankYouTab(): Window | null {
  return null;
}

/** @deprecated Use openThankYouInNewTab */
export function completeThankYouRedirect(
  _preparedTab: Window | null,
  data: Omit<CounsellingSubmitSession, 'at'>,
  path: string = THANK_YOU_PATH
): void {
  openThankYouInNewTab(data, path);
}

/** @deprecated Use openThankYouInNewTab */
export function openThankYouAfterSubmit(
  data: Omit<CounsellingSubmitSession, 'at'>,
  path: string = THANK_YOU_PATH
): void {
  openThankYouInNewTab(data, path);
}

/** Extract display name from dynamic CMS / hero form values. */
export function nameFromFormValues(
  values: Record<string, string>,
  fields: { name?: string | null; label?: string | null }[]
): string | undefined {
  const byKey = values.fullName ?? values.full_name ?? values.name;
  if (byKey?.trim()) return byKey.trim();

  const nameField = fields.find(
    (f) => /name/i.test(f.name ?? '') || /full\s*name/i.test(f.label ?? '')
  );
  if (nameField?.name) {
    const v = values[nameField.name];
    if (v?.trim()) return v.trim();
  }
  return undefined;
}
