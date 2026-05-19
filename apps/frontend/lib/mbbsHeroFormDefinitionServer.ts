import { readPayloadCms } from '@/lib/payloadCmsRead';
import { getPayloadCmsServerFetchUrl } from '@/lib/payloadCmsUrl';
import type { HeroMbbsFormDoc } from '@/lib/mbbsHeroFormDefinitionsCache';

export type MbbsHeroFormKind = 'india' | 'abroad';

export type MbbsHeroFormServerLoadResult =
  | { ok: true; doc: HeroMbbsFormDoc }
  | { ok: false; message: string; status: number };

type FormDoc = { id?: number; title?: string | null; fields?: unknown[] };
type FormsListResponse = { docs?: FormDoc[] };

const KIND_CONFIG: Record<
  MbbsHeroFormKind,
  {
    defaultTitle: string;
    titleEnv: string;
    idEnv: string;
    notFoundMessage: (title: string) => string;
  }
> = {
  india: {
    defaultTitle: 'MBBS INDIA',
    titleEnv: 'PAYLOAD_MBBS_INDIA_FORM_TITLE',
    idEnv: 'PAYLOAD_MBBS_INDIA_FORM_ID',
    notFoundMessage: (title) =>
      `No form matched "${title}". In Payload → Forms, copy the exact title into PAYLOAD_MBBS_INDIA_FORM_TITLE, or set PAYLOAD_MBBS_INDIA_FORM_ID to the form's id.`,
  },
  abroad: {
    defaultTitle: 'MBBS ABROAD',
    titleEnv: 'PAYLOAD_MBBS_ABROAD_FORM_TITLE',
    idEnv: 'PAYLOAD_MBBS_ABROAD_FORM_ID',
    notFoundMessage: (title) =>
      `No form matched "${title}". Set PAYLOAD_MBBS_ABROAD_FORM_TITLE or PAYLOAD_MBBS_ABROAD_FORM_ID in .env.local.`,
  },
};

function normalizeTitle(s: string | null | undefined): string {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function toHeroDoc(doc: FormDoc): HeroMbbsFormDoc | null {
  if (!doc?.id) return null;
  return doc as HeroMbbsFormDoc;
}

/** Loads a hero MBBS form definition from Payload (server-only, no HTTP loopback). */
export async function loadMbbsHeroFormDefinitionServer(
  kind: MbbsHeroFormKind
): Promise<MbbsHeroFormServerLoadResult> {
  const base = getPayloadCmsServerFetchUrl();
  const cfg = KIND_CONFIG[kind];
  const configuredTitle = (process.env[cfg.titleEnv] || cfg.defaultTitle).trim();
  const formIdEnv = process.env[cfg.idEnv]?.trim();

  try {
    if (formIdEnv && /^\d+$/.test(formIdEnv)) {
      const r = await readPayloadCms(`${base}/api/forms/${formIdEnv}?depth=0`);
      if (!r.json) {
        return {
          ok: false,
          status: r.responseOk ? 502 : r.status || 502,
          message: r.rawPreview
            ? 'CMS returned non-JSON. Check NEXT_PUBLIC_CMS_URL points to Payload.'
            : 'Empty response from CMS (is Payload running?)',
        };
      }
      const doc = toHeroDoc(r.json as FormDoc);
      if (doc) return { ok: true, doc };
      return {
        ok: false,
        status: 404,
        message: `Form id ${formIdEnv} not found`,
      };
    }

    const qs = new URLSearchParams({
      'where[title][equals]': configuredTitle,
      limit: '1',
      depth: '0',
    });
    const byTitle = await readPayloadCms(`${base}/api/forms?${qs.toString()}`);

    if (!byTitle.json) {
      return {
        ok: false,
        status: byTitle.responseOk ? 502 : byTitle.status || 502,
        message: byTitle.rawPreview
          ? 'CMS returned non-JSON (wrong URL or HTML error page).'
          : `Cannot reach Payload at ${base} (empty response).`,
      };
    }

    if (!byTitle.responseOk) {
      const err =
        typeof byTitle.json === 'object' && byTitle.json !== null && 'message' in byTitle.json
          ? String((byTitle.json as { message?: string }).message)
          : `Payload returned ${byTitle.status}`;
      return { ok: false, status: byTitle.status || 502, message: err };
    }

    let docs = (byTitle.json as FormsListResponse).docs ?? [];
    if (!docs.length) {
      const listQs = new URLSearchParams({ limit: '50', depth: '0', sort: '-updatedAt' });
      const listed = await readPayloadCms(`${base}/api/forms?${listQs.toString()}`);
      if (listed.json && listed.responseOk && typeof listed.json === 'object' && 'docs' in listed.json) {
        const all = ((listed.json as FormsListResponse).docs || []).filter((d) => d?.id);
        const target = normalizeTitle(configuredTitle);
        const match = all.find((d) => normalizeTitle(d.title ?? '') === target);
        if (match) docs = [match];
      }
    }

    const doc = toHeroDoc(docs[0]);
    if (doc) return { ok: true, doc };

    return {
      ok: false,
      status: 404,
      message: cfg.notFoundMessage(configuredTitle),
    };
  } catch {
    return {
      ok: false,
      status: 503,
      message: `Cannot reach CMS at ${base}. Start Payload on that host/port. If Payload is running, try PAYLOAD_CMS_URL=http://127.0.0.1:8000 (Windows often needs 127.0.0.1 instead of localhost for server-side fetch).`,
    };
  }
}

/** Fetches India and Abroad hero form definitions in parallel on the server. */
export async function loadMbbsHeroFormDefinitionsServer(): Promise<{
  india: MbbsHeroFormServerLoadResult;
  abroad: MbbsHeroFormServerLoadResult;
}> {
  const [india, abroad] = await Promise.all([
    loadMbbsHeroFormDefinitionServer('india'),
    loadMbbsHeroFormDefinitionServer('abroad'),
  ]);
  return { india, abroad };
}

export const MBBS_HERO_FORM_DEFINITION_CACHE_CONTROL =
  'public, s-maxage=60, stale-while-revalidate=300';
