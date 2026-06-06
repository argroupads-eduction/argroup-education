import { NextRequest, NextResponse } from 'next/server';
import { loadMbbsHeroFormDefinitionServer } from '@/lib/mbbsHeroFormDefinitionServer';
import { getPayloadCmsServerFetchUrl } from '@/lib/payloadCmsUrl';
import type { MbbsHeroFormKind } from '@/lib/mbbsHeroFormDefinitionServer';
import { validateSubmissionDataNames } from '@/lib/validatePersonName';
import { submitWebsiteLead } from '@backend/handlers/websiteLead';
import { scheduleLeadEmailDelivery } from '@/lib/scheduleLeadEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type SubmissionField = { field: string; value: string };

function fieldsToMap(submissionData: SubmissionField[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const { field, value } of submissionData) {
    map[field] = value;
  }
  return map;
}

async function submitToPayload(formId: number, submissionData: SubmissionField[]) {
  const base = getPayloadCmsServerFetchUrl();
  const res = await fetch(`${base}/api/form-submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ form: formId, submissionData }),
    cache: 'no-store',
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = text.trim() ? (JSON.parse(text) as unknown) : {};
  } catch {
    return NextResponse.json(
      { message: 'CMS returned non-JSON', detail: text.slice(0, 300) },
      { status: 502 }
    );
  }
  return NextResponse.json(json, { status: res.status });
}

async function submitToBackend(kind: MbbsHeroFormKind, submissionData: SubmissionField[]) {
  const map = fieldsToMap(submissionData);
  const { getApiBaseUrl } = await import('@/lib/apiBase');
  const apiUrl = getApiBaseUrl();
  const body = {
    name: map.name?.trim() || 'Unknown',
    email: map.email?.trim() || 'noreply@argroup.local',
    phone: map.phone?.trim() || '0000000000',
    course: kind === 'india' ? 'MBBS India' : 'MBBS Abroad',
    countryPreference:
      kind === 'india'
        ? `India${map.state ? ` - ${map.state}` : ''}`
        : map.country?.trim() || map.state?.trim() || 'Abroad',
  };

  try {
    const res = await fetch(`${apiUrl}/api/forms/counselling`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    let json: { success?: boolean; message?: string } = {};
    try {
      if (text.trim()) json = JSON.parse(text) as typeof json;
    } catch {
      /* ignore */
    }
    if (res.ok && json.success !== false) {
      return NextResponse.json(
        { doc: { id: 'backend' }, message: json.message || 'Thank you! We will contact you soon.' },
        { status: 201 }
      );
    }
  } catch {
    /* backend optional in local dev */
  }

  if (process.env.NODE_ENV === 'development') {
    console.info('[hero-enquiry] Stored locally (CMS/backend unavailable):', { kind, ...body });
  }

  return NextResponse.json(
    { doc: { id: 'queued' }, message: 'Thank you! We received your enquiry and will contact you soon.' },
    { status: 201 }
  );
}

/** Hero enquiry when Payload form definition is unavailable (offline fallback fields). */
export async function POST(req: NextRequest) {
  let body: { kind?: MbbsHeroFormKind; submissionData?: SubmissionField[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const kind = body.kind;
  const submissionData = body.submissionData;
  if (kind !== 'india' && kind !== 'abroad') {
    return NextResponse.json({ message: 'kind must be india or abroad' }, { status: 400 });
  }
  if (!Array.isArray(submissionData) || submissionData.length === 0) {
    return NextResponse.json({ message: 'submissionData is required' }, { status: 400 });
  }

  const nameErr = validateSubmissionDataNames(submissionData);
  if (nameErr) {
    return NextResponse.json({ message: nameErr }, { status: 400 });
  }

  try {
    const leadResult = await submitWebsiteLead(
      {
        source: kind === 'india' ? 'hero-mbbs-india' : 'hero-mbbs-abroad',
        formName: kind === 'india' ? 'MBBS India hero enquiry' : 'MBBS Abroad hero enquiry',
        fields: fieldsToMap(submissionData),
        pageUrl: req.headers.get('referer') ?? undefined,
        userAgent: req.headers.get('user-agent') ?? undefined,
      },
      { deferEmail: true }
    );
    if (!leadResult.ok) {
      return NextResponse.json({ message: leadResult.message }, { status: leadResult.status });
    }
    scheduleLeadEmailDelivery(leadResult.id);
  } catch (error) {
    console.error('[hero-enquiry] lead save failed:', error);
    return NextResponse.json({ message: 'Could not save your enquiry' }, { status: 500 });
  }

  const loaded = await loadMbbsHeroFormDefinitionServer(kind);
  if (loaded.ok) {
    return submitToPayload(loaded.doc.id, submissionData);
  }

  return submitToBackend(kind, submissionData);
}
