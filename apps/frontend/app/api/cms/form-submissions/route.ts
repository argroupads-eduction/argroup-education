import { NextRequest, NextResponse } from 'next/server';
import { getPayloadCmsServerFetchUrl } from '@/lib/payloadCmsUrl';
import { validateSubmissionDataNames } from '@/lib/validatePersonName';
import { submissionDataToFields } from '@/lib/submitWebsiteLead';
import { submitWebsiteLead } from '@backend/handlers/websiteLead';
import { deliverLeadEmailAfterSubmit } from '@/lib/scheduleLeadEmail';
import { requireVerifiedEmailForSubmit } from '@/lib/emailOtp/requireForSubmit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type FormSubmissionBody = {
  form?: number | string;
  source?: string;
  formName?: string;
  submissionData?: { field: string; value: string }[];
  /** When true, only proxy to Payload — lead already saved via /api/leads/submit */
  skipWebsiteLead?: boolean;
  emailVerificationToken?: string;
};

/** Saves lead to Neon + email, then proxies to Payload CMS when available. */
export async function POST(req: NextRequest) {
  let body: FormSubmissionBody;
  try {
    body = (await req.json()) as FormSubmissionBody;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.submissionData) || body.submissionData.length === 0) {
    return NextResponse.json({ message: 'submissionData is required' }, { status: 400 });
  }

  const nameErr = validateSubmissionDataNames(body.submissionData);
  if (nameErr) {
    return NextResponse.json({ message: nameErr }, { status: 400 });
  }

  if (!body.skipWebsiteLead) {
    const emailCheck = requireVerifiedEmailForSubmit(body.submissionData, body.emailVerificationToken);
    if (!emailCheck.ok) {
      return NextResponse.json({ message: emailCheck.message }, { status: emailCheck.status });
    }
  }

  if (!body.skipWebsiteLead) {
    try {
      const leadResult = await submitWebsiteLead(
        {
          source: body.source?.trim() || 'cms-form',
          formName: body.formName || (body.form ? `CMS form #${body.form}` : 'Website form'),
          fields: submissionDataToFields(body.submissionData),
          pageUrl: req.headers.get('referer') ?? undefined,
          userAgent: req.headers.get('user-agent') ?? undefined,
        },
        { deferEmail: true }
      );
      if (!leadResult.ok) {
        return NextResponse.json({ message: leadResult.message }, { status: leadResult.status });
      }
      deliverLeadEmailAfterSubmit(leadResult);
    } catch (error) {
      console.error('[form-submissions] lead save failed:', error);
      return NextResponse.json({ message: 'Could not save your enquiry' }, { status: 500 });
    }
  }

  const base = getPayloadCmsServerFetchUrl();
  try {
    const res = await fetch(`${base}/api/form-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });

    const text = await res.text();
    let json: unknown;
    try {
      json = text.trim() ? (JSON.parse(text) as unknown) : {};
    } catch {
      return NextResponse.json(
        {
          doc: { id: 'neon' },
          message: 'Thank you! We received your details and will contact you soon.',
        },
        { status: 201 }
      );
    }

    if (res.ok) {
      return NextResponse.json(json, { status: res.status });
    }
  } catch {
    /* CMS optional, Neon lead already saved */
  }

  return NextResponse.json(
    {
      doc: { id: 'neon' },
      message: 'Thank you! We received your details and will contact you soon.',
    },
    { status: 201 }
  );
}
