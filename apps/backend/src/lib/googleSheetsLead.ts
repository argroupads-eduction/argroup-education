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

function cleanEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed || undefined;
}

function getWebhookConfig(): { url: string; secret: string } | null {
  const url = cleanEnvValue(process.env.GOOGLE_SHEETS_WEBHOOK_URL);
  const secret = cleanEnvValue(process.env.GOOGLE_SHEETS_WEBHOOK_SECRET);
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

/**
 * GAS POST hits /exec, runs doPost, then 302 → googleusercontent.com echo URL (GET only).
 * @see https://developers.google.com/apps-script/guides/content#redirects
 */
async function fetchGoogleAppsScript(
  url: string,
  body: string,
  signal: AbortSignal
): Promise<Response> {
  const execUrl = normalizeWebhookUrl(url);

  let response = await fetch(execUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
      Accept: 'application/json',
    },
    body,
    signal,
    redirect: 'follow',
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (location) {
      response = await fetch(location, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
        redirect: 'follow',
      });
    }
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
    if (status === 405) {
      return {
        ok: false,
        message: 'Google Sheets webhook returned 405. Redeploy Apps Script web app with Anyone access.',
      };
    }
    if (status >= 300 && status < 400) {
      return { ok: false, message: 'Google Sheets webhook redirect failed. Redeploy Apps Script web app.' };
    }
    if (trimmed.includes('does not exist') || trimmed.includes('Page Not Found')) {
      return {
        ok: false,
        message:
          'Google Sheets webhook URL is invalid or deleted. Create a new Apps Script deployment and update GOOGLE_SHEETS_WEBHOOK_URL.',
      };
    }
    console.error('[google-sheets-lead] non-JSON response:', status, trimmed.slice(0, 300));
    return {
      ok: false,
      message: `Google Sheets webhook error (HTTP ${status}). Check GOOGLE_SHEETS_WEBHOOK_URL and Apps Script deployment.`,
    };
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

/** GET health check — calls Apps Script doGet (no secret). Useful after Vercel deploy. */
export async function checkGoogleSheetsWebhookHealth(): Promise<{
  configured: boolean;
  ok: boolean;
  message?: string;
  spreadsheetId?: string;
  spreadsheetName?: string;
}> {
  const config = getWebhookConfig();
  if (!config) {
    return {
      configured: false,
      ok: false,
      message: 'GOOGLE_SHEETS_WEBHOOK_URL or GOOGLE_SHEETS_WEBHOOK_SECRET not set',
    };
  }

  try {
    const res = await fetch(normalizeWebhookUrl(config.url), {
      method: 'GET',
      redirect: 'follow',
    });
    const text = await res.text();
    const json = JSON.parse(text) as {
      ok?: boolean;
      spreadsheetId?: string;
      spreadsheetName?: string;
      message?: string;
    };
    return {
      configured: true,
      ok: json.ok === true,
      message: json.message,
      spreadsheetId: json.spreadsheetId,
      spreadsheetName: json.spreadsheetName,
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
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
