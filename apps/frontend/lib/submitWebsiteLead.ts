export type SubmitWebsiteLeadPayload = {
  source: string;
  formName?: string;
  fields: Record<string, unknown> | { field: string; value: string }[];
  pageUrl?: string;
};

export type SubmitWebsiteLeadResult = {
  ok: boolean;
  message?: string;
  emailSent?: boolean;
};

/** POST lead to Neon + email notification (same-origin API route). */
export async function submitWebsiteLead(
  payload: SubmitWebsiteLeadPayload
): Promise<SubmitWebsiteLeadResult> {
  const pageUrl =
    payload.pageUrl ??
    (typeof window !== 'undefined' ? window.location.href : undefined);

  const res = await fetch('/api/leads/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...payload, pageUrl }),
    cache: 'no-store',
  });

  let json: { success?: boolean; message?: string; emailSent?: boolean } = {};
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { ok: false, message: 'Could not read server response.' };
  }

  if (!res.ok || json.success === false) {
    return { ok: false, message: json.message || 'Could not submit your enquiry.' };
  }

  return { ok: true, message: json.message, emailSent: json.emailSent };
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
