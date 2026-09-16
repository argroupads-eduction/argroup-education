import { NextRequest, NextResponse } from 'next/server';
import { predictNeetRank } from '@backend/lib/neetRankPredictor';
import type { NeetCategory } from '@backend/lib/neetRankPredictor/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/neet-rank-predictor/predict?score=600&category=general_ews */
export async function GET(req: NextRequest) {
  const score = Number(req.nextUrl.searchParams.get('score'));
  const category = (req.nextUrl.searchParams.get('category') ?? 'general_ews') as NeetCategory;

  if (!Number.isFinite(score) || score < 0 || score > 720) {
    return NextResponse.json({ message: 'score must be 0–720' }, { status: 400 });
  }

  const prediction = predictNeetRank(category, score);
  return NextResponse.json({ ok: true, prediction });
}

export async function POST(req: NextRequest) {
  let body: { score?: number; category?: NeetCategory };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const score = Number(body.score);
  const category = body.category ?? 'general_ews';

  if (!Number.isFinite(score) || score < 0 || score > 720) {
    return NextResponse.json({ message: 'score must be 0–720' }, { status: 400 });
  }

  const prediction = predictNeetRank(category, score);
  return NextResponse.json({ ok: true, prediction });
}
