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
  budget?: string;
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

export type CollegePredictorSheetPayload = {
  name: string;
  phone: string;
  email: string;
  neetAir: number;
  category: string;
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

/** Must be a deployed web-app /exec URL, not editor or spreadsheet link. */
function validateWebhookUrlFormat(url: string): string | null {
  const normalized = normalizeWebhookUrl(url);
  if (/docs\.google\.com\/spreadsheets/i.test(url)) {
    return 'GOOGLE_SHEETS_WEBHOOK_URL is a spreadsheet link. Use Deploy → Web app → copy the .../macros/s/.../exec URL from Apps Script.';
  }
  if (/\/edit\b|script\.google\.com\/home/i.test(url)) {
    return 'GOOGLE_SHEETS_WEBHOOK_URL looks like the script editor. Use Deploy → Web app → copy the /exec deployment URL.';
  }
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/i.test(normalized)) {
    return 'GOOGLE_SHEETS_WEBHOOK_URL must be https://script.google.com/macros/s/DEPLOYMENT_ID/exec';
  }
  return null;
}

function describeHtmlWebhookResponse(text: string, status: number): string {
  const sample = text.slice(0, 500).toLowerCase();
  if (sample.includes('does not exist') || sample.includes('page not found')) {
    return 'Apps Script deployment not found. Deploy → New deployment → Web app, then paste the new /exec URL in Vercel.';
  }
  if (sample.includes('sign in') || sample.includes('accounts.google.com')) {
    return 'Web app access is not "Anyone". Redeploy Apps Script with Who has access: Anyone.';
  }
  if (sample.includes('authorization is required') || sample.includes('need permission')) {
    return 'Apps Script needs authorization. Run setupSheets() once, then redeploy the web app.';
  }
  return `Webhook returned HTML instead of JSON (HTTP ${status}). Use the /exec URL from Deploy → Web app, not the sheet or editor link.`;
}

/** GAS always 302-redirects to script.googleusercontent.com; both hops use GET. */
async function fetchGoogleAppsScriptGet(url: string, signal?: AbortSignal): Promise<Response> {
  let response = await fetch(normalizeWebhookUrl(url), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
    redirect: 'manual',
  });

  for (let hop = 0; hop < 5; hop++) {
    if (response.status < 300 || response.status >= 400) break;
    const location = response.headers.get('location');
    if (!location) break;
    response = await fetch(location, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
      redirect: 'manual',
    });
  }

  return response;
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
      budget: sanitizeLeadText(payload.budget, 40),
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
  version?: string;
  webhookUrlValid?: boolean;
}> {
  const config = getWebhookConfig();
  if (!config) {
    return {
      configured: false,
      ok: false,
      message: 'GOOGLE_SHEETS_WEBHOOK_URL or GOOGLE_SHEETS_WEBHOOK_SECRET not set',
    };
  }

  const formatError = validateWebhookUrlFormat(config.url);
  if (formatError) {
    return {
      configured: true,
      ok: false,
      webhookUrlValid: false,
      message: formatError,
    };
  }

  try {
    const res = await fetchGoogleAppsScriptGet(config.url);
    const text = await res.text();
    const trimmed = text.trim();

    if (trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype')) {
      return {
        configured: true,
        ok: false,
        webhookUrlValid: false,
        message: describeHtmlWebhookResponse(text, res.status),
      };
    }

    let json: {
      ok?: boolean;
      spreadsheetId?: string;
      spreadsheetName?: string;
      version?: string;
      message?: string;
    };
    try {
      json = JSON.parse(trimmed) as typeof json;
    } catch {
      return {
        configured: true,
        ok: false,
        webhookUrlValid: true,
        message: `Webhook response was not JSON (HTTP ${res.status}). Redeploy Apps Script web app.`,
      };
    }

    return {
      configured: true,
      ok: json.ok === true,
      webhookUrlValid: true,
      message: json.ok === true ? undefined : json.message || 'Apps Script returned ok:false',
      spreadsheetId: json.spreadsheetId,
      spreadsheetName: json.spreadsheetName,
      version: json.version,
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

export async function submitCollegePredictorToGoogleSheets(
  payload: CollegePredictorSheetPayload,
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
    type: 'college_predictor',
    requestId: meta?.requestId,
    payload: {
      name: sanitizeLeadText(payload.name, 120),
      phone: phone || '',
      email,
      neetAir: payload.neetAir,
      category: sanitizeLeadText(payload.category, 80),
      state: sanitizeLeadText(payload.state, 80),
      course: sanitizeLeadText(payload.course, 120),
    },
  });
}
