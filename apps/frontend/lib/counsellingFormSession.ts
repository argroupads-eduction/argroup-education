/** Gate thank-you page — only after a successful form submit (shared via localStorage for new tabs). */

export const COUNSELLING_SUBMIT_KEY = 'ar_counselling_submitted';
export const THANK_YOU_PATH = '/thank-you';

const TTL_MS = 30 * 60 * 1000;

export type CounsellingSubmitSession = {
  at: number;
  source?: string;
  name?: string;
};

function readRaw(): CounsellingSubmitSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      localStorage.getItem(COUNSELLING_SUBMIT_KEY) ??
      sessionStorage.getItem(COUNSELLING_SUBMIT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CounsellingSubmitSession;
    if (!parsed?.at) return null;
    if (Date.now() - parsed.at > TTL_MS) {
      clearCounsellingSubmitted();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function markCounsellingSubmitted(data: Omit<CounsellingSubmitSession, 'at'>) {
  if (typeof window === 'undefined') return;
  const payload: CounsellingSubmitSession = { ...data, at: Date.now() };
  const json = JSON.stringify(payload);
  localStorage.setItem(COUNSELLING_SUBMIT_KEY, json);
  sessionStorage.setItem(COUNSELLING_SUBMIT_KEY, json);
}

export function readCounsellingSubmitted(): CounsellingSubmitSession | null {
  return readRaw();
}

export function clearCounsellingSubmitted() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COUNSELLING_SUBMIT_KEY);
  sessionStorage.removeItem(COUNSELLING_SUBMIT_KEY);
}
