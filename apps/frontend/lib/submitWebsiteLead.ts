import {
  DUPLICATE_LEAD_MESSAGE,
  SHEETS_UNAVAILABLE_MESSAGE,
  SUCCESS_LEAD_MESSAGE,
} from '@/lib/leadSubmissionMessages';
import { showLeadSubmissionFeedback } from '@/lib/leadSubmissionFeedback';

export type SubmitWebsiteLeadPayload = {
  source: string;
  formName?: string;
  fields: Record<string, unknown> | { field: string; value: string }[];
  pageUrl?: string;
  emailVerificationToken?: string;
};

export type SubmitWebsiteLeadResult = {
  ok: boolean;
  message?: string;
  emailSent?: boolean;
  duplicate?: boolean;
};

/** POST lead to Google Sheets (via API) + optional Neon/email backup. */
export async function submitWebsiteLead(
  payload: SubmitWebsiteLeadPayload
): Promise<SubmitWebsiteLeadResult> {
  const pageUrl =
    payload.pageUrl ??
    (typeof window !== 'undefined' ? window.location.href : undefined);

  const res = await fetch('/api/leads/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      source: payload.source,
      formName: payload.formName,
      fields: payload.fields,
      pageUrl,
      emailVerificationToken: payload.emailVerificationToken,
    }),
    cache: 'no-store',
  });

  let json: { success?: boolean; message?: string; emailSent?: boolean; duplicate?: boolean } =
    {};
  try {
    json = (await res.json()) as typeof json;
  } catch {
    showLeadSubmissionFeedback('error');
    return { ok: false, message: SHEETS_UNAVAILABLE_MESSAGE };
  }

  if (res.status === 409 || json.duplicate) {
    showLeadSubmissionFeedback('duplicate');
    return { ok: false, duplicate: true, message: json.message || DUPLICATE_LEAD_MESSAGE };
  }

  if (!res.ok || json.success === false) {
    showLeadSubmissionFeedback('error');
    return { ok: false, message: json.message || SHEETS_UNAVAILABLE_MESSAGE };
  }

  showLeadSubmissionFeedback('success');
  return {
    ok: true,
    message: json.message || SUCCESS_LEAD_MESSAGE,
    emailSent: json.emailSent,
  };
}

/** Convert hero/CMS submission rows to a flat field map. */
export function submissionDataToFields(
  rows: { field: string; value: string }[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const { field, value } of rows) {
    if (field) map[field] = value;
  }
  return map;
}
