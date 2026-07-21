import { NextRequest, NextResponse } from 'next/server';
import { NEET_CATEGORIES } from '@/lib/neetRankPredictor/data';
import { getCollegeRecommendationsByRank } from '@/lib/neetRankPredictor/collegeMatches';
import type { NeetCategory } from '@/lib/neetRankPredictor/types';
import { validatePersonName } from '@/lib/validatePersonName';
import { validateCityName } from '@/lib/validateCityName';
import {
  submitWebsiteLead,
  DUPLICATE_LEAD_MESSAGE,
  sendLeadEmailWithRetry,
} from '@backend/handlers/websiteLead';
import {
  isGoogleSheetsLeadEnabled,
  submitCollegePredictorToGoogleSheets,
  SHEETS_UNAVAILABLE_MESSAGE,
} from '@backend/lib/googleSheetsLead';
import { validateIndianMobile, validateLeadEmail } from '@backend/lib/leadValidation';
import { deliverLeadEmailAfterSubmit } from '@/lib/scheduleLeadEmail';
import { verifyEmailVerificationToken } from '@/lib/emailOtp/otpToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const TRACK_LABELS: Record<string, string> = {
  india: 'MBBS India',
  abroad: 'MBBS Abroad',
  'md-ms': 'MD/MS',
  bams: 'BAMS',
};

const MAX_AIR = 2_000_000;

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return null;
}

function isPlaceholderLeadEmail(email: string): boolean {
  return /^[6-9]\d{9}@leads\.argroupofeducation\.com$/i.test(email.trim());
}

/**
 * College Predictor — user enters AIR, get matched colleges.
 * Lead goes to the "College Predictor" Google Sheet tab.
 */
export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    category?: NeetCategory;
    rank?: number;
    track?: 'india' | 'abroad' | 'md-ms' | 'bams';
    emailVerificationToken?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const city = body.city?.trim();
  const phone = normalizePhone(body.phone ?? '');
  const category = body.category;
  const rank = Number(body.rank);
  const track = body.track ?? 'india';

  if (!name || name.length < 2) {
    return NextResponse.json({ message: 'Enter your full name' }, { status: 400 });
  }
  const nameErr = validatePersonName(name);
  if (nameErr) {
    return NextResponse.json({ message: nameErr }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: 'Enter a valid email' }, { status: 400 });
  }
  const emailErr = validateLeadEmail(email);
  if (emailErr) {
    return NextResponse.json({ message: emailErr }, { status: 400 });
  }
  if (isPlaceholderLeadEmail(email)) {
    return NextResponse.json({ message: 'Enter a valid email address' }, { status: 400 });
  }
  const emailVerified = verifyEmailVerificationToken(email, body.emailVerificationToken);
  if (!emailVerified.ok) {
    return NextResponse.json({ message: emailVerified.message }, { status: 403 });
  }
  if (!phone) {
    return NextResponse.json({ message: 'Please enter a valid Indian mobile number.' }, { status: 400 });
  }
  const phoneErr = validateIndianMobile(phone);
  if (phoneErr) {
    return NextResponse.json({ message: phoneErr }, { status: 400 });
  }
  const cityTrimmed = city?.trim() ?? '';
  const cityErr = validateCityName(cityTrimmed);
  if (cityErr) {
    return NextResponse.json({ message: cityErr }, { status: 400 });
  }
  if (!NEET_CATEGORIES.some((c) => c.id === category)) {
    return NextResponse.json({ message: 'Invalid category' }, { status: 400 });
  }
  if (!Number.isFinite(rank) || rank < 1 || rank > MAX_AIR) {
    return NextResponse.json(
      { message: `Enter a valid NEET AIR between 1 and ${MAX_AIR.toLocaleString('en-IN')}` },
      { status: 400 }
    );
  }

  const cat = category as NeetCategory;
  const roundedRank = Math.round(rank);
  const colleges = getCollegeRecommendationsByRank(roundedRank, cat, 36, track);
  const trackLabel = TRACK_LABELS[track] ?? track;
  const courseLabel = `College Predictor · ${trackLabel}`;
  const categoryLabel = NEET_CATEGORIES.find((c) => c.id === cat)?.label ?? cat;

  const leadFields = {
    fullName: name,
    email,
    phone,
    city: cityTrimmed,
    reservationCategory: categoryLabel,
    neetAir: roundedRank,
    studyTrack: trackLabel,
    category: cat,
    track,
    tool: 'college-predictor',
  };

  try {
    let sheetsSaved = false;

    if (isGoogleSheetsLeadEnabled()) {
      const sheetsResult = await submitCollegePredictorToGoogleSheets({
        name,
        phone,
        email,
        neetAir: roundedRank,
        category: categoryLabel,
        state: cityTrimmed,
        course: courseLabel,
      });

      if (sheetsResult.duplicate) {
        return NextResponse.json(
          { message: DUPLICATE_LEAD_MESSAGE, duplicate: true },
          { status: 409 }
        );
      }

      if (sheetsResult.ok) {
        sheetsSaved = true;
      } else {
        console.error('[college-predictor] Sheets failed — email fallback');
        const emailResult = await sendLeadEmailWithRetry({
          source: 'college-predictor',
          formName: 'College Predictor',
          fields: { ...leadFields, _sheetsError: sheetsResult.message },
          pageUrl: req.headers.get('referer') ?? '/college-predictor',
        });
        if (!emailResult.sent) {
          return NextResponse.json(
            { message: sheetsResult.message || SHEETS_UNAVAILABLE_MESSAGE },
            { status: 503 }
          );
        }
      }
    }

    if (!sheetsSaved && !isGoogleSheetsLeadEnabled()) {
      const leadResult = await submitWebsiteLead(
        {
          source: 'college-predictor',
          formName: 'College Predictor',
          fields: leadFields,
          pageUrl: req.headers.get('referer') ?? '/college-predictor',
          userAgent: req.headers.get('user-agent') ?? undefined,
        },
        { deferEmail: true, skipGoogleSheets: true }
      );

      if (!leadResult.ok) {
        return NextResponse.json({ message: leadResult.message }, { status: leadResult.status });
      }

      deliverLeadEmailAfterSubmit(leadResult);
    }

    return NextResponse.json({
      ok: true,
      rank: roundedRank,
      categoryLabel,
      colleges: {
        india: track === 'abroad' ? [] : colleges.india,
        abroad:
          track === 'india' || track === 'md-ms' || track === 'bams' ? [] : colleges.abroad,
      },
      disclaimer: colleges.disclaimer,
    });
  } catch (error) {
    console.error('[college-predictor/submit]', error);
    return NextResponse.json({ message: SHEETS_UNAVAILABLE_MESSAGE }, { status: 503 });
  }
}
