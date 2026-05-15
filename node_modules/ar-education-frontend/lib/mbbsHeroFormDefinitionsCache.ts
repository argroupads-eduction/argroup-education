/**
 * Dedupes and caches Payload form definitions for MBBS India / Abroad hero forms.
 * Survives component unmount so switching slides does not refetch or flash "Loading…".
 */

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

const bucket: Record<
  Kind,
  { inflight?: Promise<HeroMbbsFormDefinitionResult>; done?: HeroMbbsFormDefinitionResult }
> = {
  india: {},
  abroad: {},
};

function formPath(kind: Kind): string {
  return kind === 'india' ? '/api/cms/forms/mbbs-india' : '/api/cms/forms/mbbs-abroad';
}

async function fetchDefinition(kind: Kind): Promise<HeroMbbsFormDefinitionResult> {
  const res = await fetch(formPath(kind), { cache: 'force-cache' });
  const raw = await res.text();
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

/** Resolved result after a completed load (success or failure). */
export function peekHeroMbbsFormDefinition(kind: Kind): HeroMbbsFormDefinitionResult | undefined {
  return bucket[kind].done;
}

/**
 * Single shared request per kind; result is cached for the session.
 */
export function loadHeroMbbsFormDefinition(kind: Kind): Promise<HeroMbbsFormDefinitionResult> {
  const b = bucket[kind];
  if (b.done) return Promise.resolve(b.done);
  if (!b.inflight) {
    b.inflight = fetchDefinition(kind).then((result) => {
      b.done = result;
      return result;
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
