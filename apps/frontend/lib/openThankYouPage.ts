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
 * Open a blank tab synchronously on user click (before any await).
 * Pass the returned window to `openThankYouInNewTab` after submit succeeds.
 */
export function prepareThankYouTab(): Window | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.open('', '_blank');
  } catch {
    return null;
  }
}

/**
 * Navigate to thank-you after a successful submit.
 * When `preopened` is set (from prepareThankYouTab), navigates that tab instead of window.open.
 */
export function openThankYouInNewTab(
  data: Omit<CounsellingSubmitSession, 'at'>,
  path: string = THANK_YOU_PATH,
  preopened?: Window | null
): void {
  if (typeof window === 'undefined') return;

  markCounsellingSubmitted(data);
  const url = getThankYouUrl(path);

  if (preopened && !preopened.closed) {
    try {
      preopened.location.replace(url);
      preopened.focus();
      return;
    } catch {
      try {
        preopened.close();
      } catch {
        /* ignore */
      }
    }
  }

  const tab = window.open(url, '_blank', 'noopener,noreferrer');
  if (tab) {
    tab.focus();
    return;
  }

  window.location.assign(url);
}

/** Close a pre-opened tab when submit fails (validation/API error). */
export function cancelPreparedThankYouTab(preopened?: Window | null): void {
  if (!preopened || preopened.closed) return;
  try {
    preopened.close();
  } catch {
    /* ignore */
  }
}

/** @deprecated Use prepareThankYouTab + openThankYouInNewTab */
export function completeThankYouRedirect(
  preopenedTab: Window | null,
  data: Omit<CounsellingSubmitSession, 'at'>,
  path: string = THANK_YOU_PATH
): void {
  openThankYouInNewTab(data, path, preopenedTab);
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
