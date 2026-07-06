import { NextRequest, NextResponse } from 'next/server';
import { NEET_CATEGORIES } from '@/lib/neetRankPredictor/data';
import { getCollegeRecommendations } from '@/lib/neetRankPredictor/collegeMatches';
import { predictNeetRank } from '@backend/lib/neetRankPredictor';
import type { NeetCategory } from '@/lib/neetRankPredictor/types';
import { validatePersonName } from '@/lib/validatePersonName';
import { validateCityName } from '@/lib/validateCityName';
import { prisma, withPrismaRetry } from '@backend/lib/prisma';
import {
  submitWebsiteLead,
  DUPLICATE_LEAD_MESSAGE,
  sendLeadEmailWithRetry,
} from '@backend/handlers/websiteLead';
import { isDatabaseUnavailableError } from '@backend/lib/neonDatabaseUrl';
import {
  isGoogleSheetsLeadEnabled,
  submitRankPredictorToGoogleSheets,
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
  both: 'MBBS India + Abroad',
  'md-ms': 'MD/MS',
  bams: 'BAMS',
};

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return null;
}

/** NEET rank predictor, saves to Neon + same lead email as all other forms */
export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    category?: NeetCategory;
    score?: number;
    track?: 'india' | 'abroad' | 'both' | 'md-ms' | 'bams';
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
  const score = Number(body.score);
  const track = body.track ?? 'both';

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
  if (!Number.isFinite(score) || score < 0 || score > 720) {
    return NextResponse.json({ message: 'Score must be between 0 and 720' }, { status: 400 });
  }

  const cat = category as NeetCategory;
  const roundedScore = Math.round(score);
  const prediction = predictNeetRank(cat, roundedScore);
  const colleges = getCollegeRecommendations(cat, roundedScore, prediction.expectedRank);
  const trackLabel = TRACK_LABELS[track] ?? track;

  const leadFields = {
    fullName: name,
    email,
    phone,
    city: cityTrimmed,
    reservationCategory: prediction.categoryLabel,
    neetScore: roundedScore,
    studyTrack: trackLabel,
    expectedRank: prediction.expectedRank,
    bestRank: prediction.bestRank,
    worstRank: prediction.worstRank,
    percentile: prediction.percentileLabel,
    collegeChances: prediction.collegeChances,
    category: cat,
    track,
  };

  try {
    let sheetsSaved = false;

    if (isGoogleSheetsLeadEnabled()) {
      const sheetsResult = await submitRankPredictorToGoogleSheets({
        name,
        phone,
        email,
        neetScore: roundedScore,
        predictedRank: prediction.expectedRank,
        state: cityTrimmed,
        course: trackLabel,
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
        console.error('[neet-rank-predictor] Sheets failed — email fallback');
        const emailResult = await sendLeadEmailWithRetry({
          source: 'neet-rank-predictor',
          formName: 'NEET Rank Predictor',
          fields: { ...leadFields, _sheetsError: sheetsResult.message },
          pageUrl: req.headers.get('referer') ?? '/neet-rank-predictor',
        });
        if (!emailResult.sent) {
          return NextResponse.json(
            { message: sheetsResult.message || SHEETS_UNAVAILABLE_MESSAGE },
            { status: 503 }
          );
        }
      }
    }

    try {
      await withPrismaRetry(() =>
        prisma.neetRankPredictorSubmission.create({
          data: {
            name,
            email,
            phone,
            city: cityTrimmed,
            category: cat,
            score: roundedScore,
            bestRank: prediction.bestRank,
            expectedRank: prediction.expectedRank,
            worstRank: prediction.worstRank,
            percentile: prediction.percentile,
            collegeChances: `${prediction.collegeChances} | track:${track}`,
          },
        })
      );
    } catch (err) {
      if (!isDatabaseUnavailableError(err)) {
        console.error('[neet-rank-predictor] analytics save failed:', err);
      }
    }

    if (!sheetsSaved && !isGoogleSheetsLeadEnabled()) {
      const leadResult = await submitWebsiteLead(
        {
          source: 'neet-rank-predictor',
          formName: 'NEET Rank Predictor',
          fields: leadFields,
          pageUrl: req.headers.get('referer') ?? '/neet-rank-predictor',
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
      prediction,
      colleges: {
        india:
          track === 'abroad' || track === 'md-ms' || track === 'bams' ? [] : colleges.india,
        abroad:
          track === 'india' || track === 'md-ms' || track === 'bams' ? [] : colleges.abroad,
      },
    });
  } catch (error) {
    console.error('[neet-rank-predictor/submit]', error);
    return NextResponse.json(
      { message: SHEETS_UNAVAILABLE_MESSAGE },
      { status: 503 }
    );
  }
}
