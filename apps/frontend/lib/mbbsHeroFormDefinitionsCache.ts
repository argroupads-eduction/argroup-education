/**
 * Dedupes and caches Payload form definitions for MBBS India / Abroad hero forms.
 * Survives component unmount so switching slides does not refetch or flash "Loading…".
 */

import { sleep } from '@/lib/fetchWithRetry';
import { isTransientHeroCmsError } from '@/lib/heroCmsConnection';

export type HeroMbbsFormFieldBlock = {
  id?: string | null;
  blockName?: string | null;
  blockType: string;
  name?: string;
  label?: string | null;
  required?: boolean | null;
  defaultValue?: string | number | boolean | null;
  placeholder?: string | null;
  width?: number | null;
  options?: { label: string; value: string }[] | null;
};

export type HeroMbbsFormDoc = {
  id: number;
  title?: string;
  submitButtonLabel?: string | null;
  confirmationType?: 'message' | 'redirect' | null;
  fields?: HeroMbbsFormFieldBlock[] | null;
};

type FormsListResponse = {
  docs?: HeroMbbsFormDoc[];
  message?: string;
};

export type HeroMbbsFormDefinitionResult =
  | { ok: true; doc: HeroMbbsFormDoc }
  | { ok: false; message: string };

type Kind = 'india' | 'abroad';

type BucketEntry = {
  inflight?: Promise<HeroMbbsFormDefinitionResult>;
  /** Cached only on success — failures are not pinned for the session. */
  done?: HeroMbbsFormDoc;
  lastError?: string;
};

const bucket: Record<Kind, BucketEntry> = {
  india: {},
  abroad: {},
};

const CLIENT_FETCH_ATTEMPTS = 2;
const CLIENT_FETCH_DELAY_MS = 400;

function formPath(kind: Kind): string {
  return kind === 'india' ? '/api/cms/forms/mbbs-india' : '/api/cms/forms/mbbs-abroad';
}

async function fetchDefinitionOnce(kind: Kind): Promise<HeroMbbsFormDefinitionResult> {
  let res: Response;
  try {
    res = await fetch(formPath(kind), { cache: 'default' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      message:
        /failed to fetch|network error|load failed/i.test(msg)
          ? 'Cannot reach form API. Run the frontend on port 3000 and start Payload on port 8000 for CMS forms.'
          : msg,
    };
  }

  let raw: string;
  try {
    raw = await res.text();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg || 'Could not read form API response.' };
  }
  let data: (FormsListResponse & { message?: string }) | null = null;
  try {
    data = raw.trim() ? (JSON.parse(raw) as FormsListResponse & { message?: string }) : null;
  } catch {
    return {
      ok: false,
      message: raw.trim()
        ? `Invalid response from form API (${res.status}).`
        : 'Empty response from form API. Check Payload is running and NEXT_PUBLIC_CMS_URL.',
    };
  }
  if (!data) {
    return { ok: false, message: 'Empty response from form API.' };
  }
  if (!res.ok) {
    return { ok: false, message: data.message || `Could not load form (${res.status})` };
  }
  const doc = data.docs?.[0];
  if (!doc?.id) {
    return {
      ok: false,
      message:
        kind === 'india'
          ? 'No form named "MBBS INDIA" found in Payload. Check the form title in CMS.'
          : 'No form titled "MBBS ABROAD" found in Payload. Create it in Forms or set PAYLOAD_MBBS_ABROAD_FORM_TITLE / PAYLOAD_MBBS_ABROAD_FORM_ID.',
    };
  }
  return { ok: true, doc };
}

async function fetchDefinition(kind: Kind): Promise<HeroMbbsFormDefinitionResult> {
  let delay = CLIENT_FETCH_DELAY_MS;
  let last: HeroMbbsFormDefinitionResult = { ok: false, message: 'Could not load form.' };

  for (let i = 0; i < CLIENT_FETCH_ATTEMPTS; i++) {
    last = await fetchDefinitionOnce(kind);
    if (last.ok) return last;
    if (!isTransientHeroCmsError(last.message) || i === CLIENT_FETCH_ATTEMPTS - 1) {
      return last;
    }
    await sleep(delay);
    delay = Math.round(delay * 1.5);
  }

  return last;
}

/** Resolved result after a completed load (success or last failure). */
export function peekHeroMbbsFormDefinition(kind: Kind): HeroMbbsFormDefinitionResult | undefined {
  const b = bucket[kind];
  if (b.done) return { ok: true, doc: b.done };
  if (b.lastError) return { ok: false, message: b.lastError };
  return undefined;
}

/** Pre-populate session cache from server-rendered definitions (first paint). */
export function seedHeroMbbsFormDefinitions(
  entries: Partial<Record<Kind, HeroMbbsFormDoc | null | undefined>>
): void {
  for (const kind of ['india', 'abroad'] as const) {
    const doc = entries[kind];
    if (doc?.id) {
      bucket[kind].done = doc;
      delete bucket[kind].lastError;
      delete bucket[kind].inflight;
    }
  }
}

/** Start parallel client fetches for the given kinds (deduped via loadHeroMbbsFormDefinition). */
export function prefetchMbbsHeroFormDefinitions(kinds: Kind[]): void {
  void Promise.all(kinds.map((kind) => loadHeroMbbsFormDefinition(kind)));
}

export function clearHeroMbbsFormDefinitionCache(kind?: Kind): void {
  if (kind) {
    bucket[kind] = {};
    return;
  }
  bucket.india = {};
  bucket.abroad = {};
}

/**
 * Single shared request per kind; successful results are cached for the session.
 * Pass `{ force: true }` to bypass cache after CMS was temporarily down.
 */
export function loadHeroMbbsFormDefinition(
  kind: Kind,
  options?: { force?: boolean }
): Promise<HeroMbbsFormDefinitionResult> {
  const b = bucket[kind];
  if (options?.force) {
    delete b.inflight;
    delete b.done;
    delete b.lastError;
  } else if (b.done) {
    return Promise.resolve({ ok: true, doc: b.done });
  }

  if (!b.inflight) {
    b.inflight = fetchDefinition(kind)
      .then((result) => {
        delete b.inflight;
        if (result.ok) {
          b.done = result.doc;
          delete b.lastError;
        } else {
          b.lastError = result.message;
        }
        return result;
      })
      .catch((e: unknown) => {
        delete b.inflight;
        const message =
          e instanceof Error ? e.message : 'Could not load form definition.';
        b.lastError = message;
        return { ok: false as const, message };
      });
  }
  return b.inflight;
}

export function buildHeroMbbsFormInitialValues(doc: HeroMbbsFormDoc): Record<string, string> {
  const initial: Record<string, string> = {};
  for (const f of doc.fields || []) {
    if (!f.name || f.blockType === 'message') continue;
    if (f.defaultValue !== undefined && f.defaultValue !== null) {
      initial[f.name] = String(f.defaultValue);
    } else {
      initial[f.name] = '';
    }
  }
  return initial;
}
