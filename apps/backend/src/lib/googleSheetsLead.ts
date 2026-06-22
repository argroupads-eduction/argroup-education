import {
  isValidIndianMobile,
  isValidLeadEmail,
  normalizeIndianMobile,
  normalizeLeadEmail,
  sanitizeLeadText,
} from './leadValidation';

export const SHEETS_UNAVAILABLE_MESSAGE =
  'We are unable to process your enquiry right now. Please try again later.';

export type WebsiteLeadSheetPayload = {
  name: string;
  phone?: string;
  email: string;
  city?: string;
  state?: string;
  country?: string;
  course?: string;
  sheetKey?: string;
  source?: string;
  sourcePage?: string;
  formType?: string;
  message?: string;
};

export type RankPredictorSheetPayload = {
  name: string;
  phone: string;
  email: string;
  neetScore: number;
  predictedRank: number;
  state?: string;
  course?: string;
};

type SheetsWebhookResponse = {
  ok?: boolean;
  duplicate?: boolean;
  leadId?: string;
  message?: string;
};

function getWebhookConfig(): { url: string; secret: string } | null {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim();
  if (!url || !secret) return null;
  return { url, secret };
}

export function isGoogleSheetsLeadEnabled(): boolean {
  return getWebhookConfig() !== null;
}

function normalizeWebhookUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.endsWith('/dev')) return trimmed;
  if (trimmed.endsWith('/exec')) return trimmed;
  return trimmed.replace(/\/$/, '') + '/exec';
}

/** Google Apps Script web apps redirect POST; follow manually with same body. */
async function fetchGoogleAppsScript(
  url: string,
  body: string,
  signal: AbortSignal
): Promise<Response> {
  let currentUrl = normalizeWebhookUrl(url);
  let response = await fetch(currentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body,
    signal,
    redirect: 'manual',
  });

  for (let hop = 0; hop < 5; hop++) {
    if (response.status < 300 || response.status >= 400) break;
    const location = response.headers.get('location');
    if (!location) break;
    currentUrl = location;
    response = await fetch(currentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
      signal,
      redirect: 'manual',
    });
  }

  return response;
}

function parseSheetsResponse(text: string, status: number): SheetsWebhookResponse {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, message: SHEETS_UNAVAILABLE_MESSAGE };
  }

  try {
    return JSON.parse(trimmed) as SheetsWebhookResponse;
  } catch {
    if (trimmed.includes('Unauthorized') || trimmed.includes('401')) {
      return { ok: false, message: 'Google Sheets webhook unauthorized. Check WEBHOOK_SECRET on Vercel.' };
    }
    if (status >= 300 && status < 400) {
      return { ok: false, message: 'Google Sheets webhook redirect failed. Redeploy Apps Script web app.' };
    }
    console.error('[google-sheets-lead] non-JSON response:', trimmed.slice(0, 300));
    return { ok: false, message: SHEETS_UNAVAILABLE_MESSAGE };
  }
}

async function postToSheetsWebhook(body: Record<string, unknown>): Promise<SheetsWebhookResponse> {
  const config = getWebhookConfig();
  if (!config) {
    return { ok: false, message: 'Google Sheets webhook is not configured' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const payload = JSON.stringify({ ...body, secret: config.secret });

  try {
    const res = await fetchGoogleAppsScript(config.url, payload, controller.signal);
    const text = await res.text();
    const json = parseSheetsResponse(text, res.status);

    if (res.status === 409 || json.duplicate) {
      return { ok: false, duplicate: true, message: json.message };
    }

    if (json.ok === false) {
      return { ok: false, message: json.message || SHEETS_UNAVAILABLE_MESSAGE };
    }

    if (!res.ok && json.ok !== true) {
      return { ok: false, message: json.message || SHEETS_UNAVAILABLE_MESSAGE };
    }

    return { ok: true, leadId: json.leadId, message: json.message };
  } catch (error) {
    console.error('[google-sheets-lead] webhook failed:', error);
    return { ok: false, message: SHEETS_UNAVAILABLE_MESSAGE };
  } finally {
    clearTimeout(timeout);
  }
}

export async function submitWebsiteLeadToGoogleSheets(
  payload: WebsiteLeadSheetPayload,
  meta?: { requestId?: string }
): Promise<SheetsWebhookResponse> {
  const phone = normalizeIndianMobile(payload.phone);
  const email = normalizeLeadEmail(payload.email);

  if (phone && !isValidIndianMobile(phone)) {
    return { ok: false, message: 'Invalid phone number' };
  }
  if (!email || !isValidLeadEmail(email)) {
    return { ok: false, message: 'Invalid email address' };
  }

  return postToSheetsWebhook({
    type: 'website',
    requestId: meta?.requestId,
    payload: {
      name: sanitizeLeadText(payload.name, 120),
      phone: phone || '',
      email,
      city: sanitizeLeadText(payload.city, 80),
      state: sanitizeLeadText(payload.state, 80),
      country: sanitizeLeadText(payload.country, 80),
      course: sanitizeLeadText(payload.course, 120),
      sheetKey: sanitizeLeadText(payload.sheetKey, 40),
      source: sanitizeLeadText(payload.source, 120),
      sourcePage: sanitizeLeadText(payload.sourcePage, 300),
      formType: sanitizeLeadText(payload.formType, 120),
      message: sanitizeLeadText(payload.message, 2000),
    },
  });
}

export async function submitRankPredictorToGoogleSheets(
  payload: RankPredictorSheetPayload,
  meta?: { requestId?: string }
): Promise<SheetsWebhookResponse> {
  const phone = normalizeIndianMobile(payload.phone);
  const email = normalizeLeadEmail(payload.email);

  if (!phone || !isValidIndianMobile(phone)) {
    return { ok: false, message: 'Invalid phone number' };
  }
  if (!email || !isValidLeadEmail(email)) {
    return { ok: false, message: 'Invalid email address' };
  }

  return postToSheetsWebhook({
    type: 'rank_predictor',
    requestId: meta?.requestId,
    payload: {
      name: sanitizeLeadText(payload.name, 120),
      phone: phone || '',
      email,
      neetScore: payload.neetScore,
      predictedRank: payload.predictedRank,
      state: sanitizeLeadText(payload.state, 80),
      course: sanitizeLeadText(payload.course, 120),
    },
  });
}
