import { NextRequest, NextResponse } from 'next/server';
import { submitWebsiteLead, type WebsiteLeadInput } from '@backend/handlers/websiteLead';
import { deliverLeadEmailAfterSubmit } from '@/lib/scheduleLeadEmail';
import { requireVerifiedEmailForSubmit } from '@/lib/emailOtp/requireForSubmit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type LeadSubmitBody = {
  source?: string;
  formName?: string;
  fields?: Record<string, unknown> | { field: string; value: string }[];
  pageUrl?: string;
  emailVerificationToken?: string;
};

/** Saves every website form lead to Neon + emails argroupads@gmail.com */
export async function POST(req: NextRequest) {
  let body: LeadSubmitBody;
  try {
    body = (await req.json()) as LeadSubmitBody;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  const source = body.source?.trim();
  if (!source) {
    return NextResponse.json({ success: false, message: 'source is required' }, { status: 400 });
  }
  if (!body.fields) {
    return NextResponse.json({ success: false, message: 'fields are required' }, { status: 400 });
  }

  const emailCheck = requireVerifiedEmailForSubmit(body.fields, body.emailVerificationToken);
  if (!emailCheck.ok) {
    return NextResponse.json({ success: false, message: emailCheck.message }, { status: emailCheck.status });
  }

  try {
    const result = await submitWebsiteLead(
      {
        source,
        formName: body.formName,
        fields: body.fields as WebsiteLeadInput['fields'],
        pageUrl: body.pageUrl,
        userAgent: req.headers.get('user-agent') ?? undefined,
      },
      { deferEmail: true }
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          duplicate: 'duplicate' in result ? result.duplicate : undefined,
        },
        { status: result.status }
      );
    }

    deliverLeadEmailAfterSubmit(result);

    return NextResponse.json(
      {
        success: true,
        id: result.id,
        emailSent: result.emailSent,
        message: result.message,
      },
      { status: result.status }
    );
  } catch (error) {
    console.error('[api/leads/submit]', error);
    return NextResponse.json(
      { success: false, message: 'We are unable to process your enquiry right now. Please try again later.' },
      { status: 500 }
    );
  }
}
