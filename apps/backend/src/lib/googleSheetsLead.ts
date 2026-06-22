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

async function postToSheetsWebhook(body: Record<string, unknown>): Promise<SheetsWebhookResponse> {
  const config = getWebhookConfig();
  if (!config) {
    return { ok: false, message: 'Google Sheets webhook is not configured' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Lead-Webhook-Secret': config.secret,
      },
      body: JSON.stringify({ ...body, secret: config.secret }),
      signal: controller.signal,
      cache: 'no-store',
    });

    let json: SheetsWebhookResponse = {};
    const text = await res.text();
    try {
      json = text.trim() ? (JSON.parse(text) as SheetsWebhookResponse) : {};
    } catch {
      return { ok: false, message: SHEETS_UNAVAILABLE_MESSAGE };
    }

    if (res.status === 409 || json.duplicate) {
      return { ok: false, duplicate: true, message: json.message };
    }

    if (!res.ok || json.ok === false) {
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
