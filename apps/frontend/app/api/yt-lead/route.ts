import { NextRequest, NextResponse } from 'next/server';
import {
  isValidIndianMobile,
  normalizeIndianMobile,
  sanitizeLeadText,
} from '@backend/lib/leadValidation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const COURSES = ['MBBS India', 'MBBS Abroad', 'MD/MS', 'BAMS'] as const;
type CourseLabel = (typeof COURSES)[number];

type Body = {
  name?: string;
  phone?: string;
  state?: string;
  course?: string;
};

function isCourseLabel(value: string): value is CourseLabel {
  return (COURSES as readonly string[]).includes(value);
}

function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v || undefined;
}

/** YouTube counselling form → YOUTUBE LEADS sheet only (not MBBS GOOGLE_SHEETS_*). */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request.' }, { status: 400 });
  }

  const name = sanitizeLeadText(body.name, 120);
  const state = sanitizeLeadText(body.state, 80);
  const course = sanitizeLeadText(body.course, 40);
  const phone = normalizeIndianMobile(body.phone);

  if (!name) {
    return NextResponse.json({ ok: false, message: 'Please enter your name.' }, { status: 400 });
  }
  if (!phone || !isValidIndianMobile(phone)) {
    return NextResponse.json(
      { ok: false, message: 'Please enter a valid 10-digit Indian mobile number.' },
      { status: 400 }
    );
  }
  if (!state) {
    return NextResponse.json({ ok: false, message: 'Please select your state.' }, { status: 400 });
  }
  if (!course || !isCourseLabel(course)) {
    return NextResponse.json({ ok: false, message: 'Please select a course.' }, { status: 400 });
  }

  const url = cleanEnv(process.env.YOUTUBE_LEADS_WEBHOOK_URL);
  const secret = cleanEnv(process.env.YOUTUBE_LEADS_WEBHOOK_SECRET);

  if (!url || !secret) {
    console.error('[yt-lead] YOUTUBE_LEADS_WEBHOOK_URL or YOUTUBE_LEADS_WEBHOOK_SECRET not set');
    return NextResponse.json({ ok: false, message: 'Server not configured' }, { status: 500 });
  }

  const requestId = crypto.randomUUID();
  const payload = {
    secret,
    requestId,
    payload: {
      name,
      phone,
      state,
      course,
      sourcePage: req.headers.get('referer') || '/counselling-form',
      formType: 'YouTube Counselling Form',
      message: `YouTube lead · ${course} · ${state}`,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      redirect: 'follow',
    });

    const text = await res.text();
    let json: { ok?: boolean; duplicate?: boolean; message?: string } = {};
    try {
      json = JSON.parse(text) as typeof json;
    } catch {
      console.error('[yt-lead] non-JSON webhook response', res.status);
      return NextResponse.json(
        { ok: false, message: 'Unable to save your details right now.' },
        { status: 502 }
      );
    }

    if (json.duplicate) {
      // Still success for user — lead already captured, nothing missed
      return NextResponse.json({ ok: true, duplicate: true, message: json.message }, { status: 200 });
    }

    if (!json.ok) {
      return NextResponse.json(
        { ok: false, message: json.message || 'Unable to save your details right now.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, message: 'Submitted successfully.' }, { status: 201 });
  } catch (error) {
    console.error('[yt-lead] webhook failed:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { ok: false, message: 'Unable to save your details right now.' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
