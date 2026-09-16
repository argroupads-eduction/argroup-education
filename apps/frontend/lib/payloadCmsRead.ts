import { sleep } from '@/lib/fetchWithRetry';

export type PayloadCmsReadResult = {
  status: number;
  responseOk: boolean;
  json: unknown | null;
  rawPreview: string;
};

export function cmsHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const key =
    process.env.PAYLOAD_CMS_API_KEY ||
    process.env.PAYLOAD_FORMS_READ_API_KEY ||
    process.env.PAYLOAD_PREVIEW_API_KEY;
  if (key) {
    headers.Authorization = `users API-Key ${key}`;
  }
  return headers;
}

function isTransientPayloadStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

function parsePayloadBody(raw: string): Omit<PayloadCmsReadResult, 'status' | 'responseOk'> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { json: null, rawPreview: '' };
  }
  try {
    return {
      json: JSON.parse(trimmed) as unknown,
      rawPreview: trimmed.slice(0, 200),
    };
  } catch {
    return { json: null, rawPreview: trimmed.slice(0, 200) };
  }
}

/** Per-attempt timeout — fail fast when Payload is down instead of hanging. */
const CMS_FETCH_TIMEOUT_MS = 7000;

/**
 * Reads JSON from Payload with retries when CMS is still starting or unreachable.
 */
export async function readPayloadCms(url: string): Promise<PayloadCmsReadResult> {
  const attempts = 2;
  const delayMs = 400;
  let delay = delayMs;

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: cmsHeaders(),
        signal: AbortSignal.timeout(CMS_FETCH_TIMEOUT_MS),
      });
      const raw = await res.text();
      const parsed = parsePayloadBody(raw);
      const emptyUnreachable = !parsed.json && !parsed.rawPreview && !res.ok;
      const transient =
        emptyUnreachable || isTransientPayloadStatus(res.status);

      if (transient && i < attempts - 1) {
        await sleep(delay);
        delay = Math.round(delay * 1.5);
        continue;
      }

      return {
        status: res.status,
        responseOk: res.ok,
        ...parsed,
      };
    } catch (e) {
      if (i === attempts - 1) throw e;
      await sleep(delay);
      delay = Math.round(delay * 1.5);
    }
  }

  throw new Error('readPayloadCms: exhausted attempts');
}
