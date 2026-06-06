import { NextRequest, NextResponse } from 'next/server';
import { NEET_CATEGORIES } from '@/lib/neetRankPredictor/data';
import { getCollegeRecommendations } from '@/lib/neetRankPredictor/collegeMatches';
import { predictNeetRank } from '@/lib/neetRankPredictor/predict';
import type { NeetCategory } from '@/lib/neetRankPredictor/types';
import { validatePersonName } from '@/lib/validatePersonName';
import { prisma, withPrismaRetry } from '@backend/lib/prisma';
import { submitWebsiteLead } from '@backend/handlers/websiteLead';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return null;
}

async function persistLead(body: Record<string, unknown>) {
  try {
    await withPrismaRetry(() =>
      prisma.neetRankPredictorSubmission.create({
        data: {
          name: String(body.name),
          email: String(body.email),
          phone: String(body.phone),
          city: String(body.city),
          category: String(body.category),
          score: Number(body.score),
          bestRank: Number(body.bestRank),
          expectedRank: Number(body.expectedRank),
          worstRank: Number(body.worstRank),
          percentile: Number(body.percentile),
          collegeChances: String(body.collegeChances),
        },
      })
    );
  } catch (err) {
    console.error('[neet-rank-predictor] DB save failed:', err);
  }

  try {
    await submitWebsiteLead({
      source: 'neet-rank-predictor',
      formName: 'NEET Rank Predictor',
      fields: body,
    });
  } catch (err) {
    console.error('[neet-rank-predictor] lead notify failed:', err);
  }
}

export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    category?: NeetCategory;
    score?: number;
    track?: 'india' | 'abroad' | 'both';
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
  if (!phone) {
    return NextResponse.json({ message: 'Enter a valid 10-digit mobile number' }, { status: 400 });
  }
  if (!city || city.length < 2) {
    return NextResponse.json({ message: 'Enter your city' }, { status: 400 });
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
  const colleges = getCollegeRecommendations(cat, roundedScore);

  await persistLead({
    name,
    email,
    phone,
    city,
    category: cat,
    score: roundedScore,
    track,
    bestRank: prediction.bestRank,
    expectedRank: prediction.expectedRank,
    worstRank: prediction.worstRank,
    percentile: prediction.percentile,
    collegeChances: `${prediction.collegeChances} | track:${track}`,
  });

  return NextResponse.json({
    ok: true,
    prediction,
    colleges: {
      india: track === 'abroad' ? [] : colleges.india,
      abroad: track === 'india' ? [] : colleges.abroad,
    },
  });
}
