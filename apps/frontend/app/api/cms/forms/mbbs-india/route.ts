import { NextResponse } from 'next/server';
import { readPayloadCms } from '@/lib/payloadCmsRead';
import { getPayloadCmsServerFetchUrl } from '@/lib/payloadCmsUrl';

export const dynamic = 'force-dynamic';

const DEFAULT_TITLE = 'MBBS INDIA';

type FormDoc = { id?: number; title?: string | null; fields?: unknown[] };
type FormsListResponse = { docs?: FormDoc[] };

function normalizeTitle(s: string | null | undefined): string {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Fetches the Payload form used on the home hero (India variant).
 * - PAYLOAD_MBBS_INDIA_FORM_ID: numeric id (recommended).
 * - PAYLOAD_MBBS_INDIA_FORM_TITLE: title match (default "MBBS INDIA"), then case-insensitive fallback on recent forms.
 */
export async function GET() {
  const base = getPayloadCmsServerFetchUrl();
  const configuredTitle = (process.env.PAYLOAD_MBBS_INDIA_FORM_TITLE || DEFAULT_TITLE).trim();
  const formIdEnv = process.env.PAYLOAD_MBBS_INDIA_FORM_ID?.trim();

  try {
    if (formIdEnv && /^\d+$/.test(formIdEnv)) {
      const r = await readPayloadCms(`${base}/api/forms/${formIdEnv}?depth=0`);
      if (!r.json) {
        return NextResponse.json(
          {
            message: r.rawPreview
              ? 'CMS returned non-JSON. Check NEXT_PUBLIC_CMS_URL points to Payload.'
              : 'Empty response from CMS (is Payload running?)',
            docs: [],
          },
          { status: r.responseOk ? 502 : r.status || 502 }
        );
      }
      if (typeof r.json === 'object' && r.json !== null && 'id' in r.json) {
        return NextResponse.json({ docs: [r.json] });
      }
      return NextResponse.json(
        { message: `Form id ${formIdEnv} not found`, docs: [] },
        { status: 404 }
      );
    }

    const qs = new URLSearchParams({
      'where[title][equals]': configuredTitle,
      limit: '1',
      depth: '0',
    });
    const byTitle = await readPayloadCms(`${base}/api/forms?${qs.toString()}`);

    if (!byTitle.json) {
      return NextResponse.json(
        {
          message: byTitle.rawPreview
            ? 'CMS returned non-JSON (wrong URL or HTML error page).'
            : `Cannot reach Payload at ${base} (empty response).`,
          detail: byTitle.rawPreview,
          docs: [],
        },
        { status: byTitle.responseOk ? 502 : byTitle.status || 502 }
      );
    }

    if (!byTitle.responseOk) {
      const err =
        typeof byTitle.json === 'object' && byTitle.json !== null && 'message' in byTitle.json
          ? String((byTitle.json as { message?: string }).message)
          : `Payload returned ${byTitle.status}`;
      return NextResponse.json({ message: err, docs: [] }, { status: byTitle.status || 502 });
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

    if (!docs.length) {
      return NextResponse.json(
        {
          message: `No form matched "${configuredTitle}". In Payload → Forms, copy the exact title into PAYLOAD_MBBS_INDIA_FORM_TITLE, or set PAYLOAD_MBBS_INDIA_FORM_ID to the form's id.`,
          docs: [],
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ docs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        message: `Cannot reach CMS at ${base}. Start Payload on that host/port. If Payload is running, try PAYLOAD_CMS_URL=http://127.0.0.1:8000 (Windows often needs 127.0.0.1 instead of localhost for server-side fetch).`,
        detail: msg,
        docs: [],
      },
      { status: 503 }
    );
  }
}
