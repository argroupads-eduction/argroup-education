import { NextRequest, NextResponse } from 'next/server';
import { predictNeetRank } from '@/lib/neetRankPredictor/predict';
import { verifyOtpToken } from '@/lib/neetRankPredictor/otpToken';

export const dynamic = 'force-dynamic';

async function persistLead(
  data: Awaited<ReturnType<typeof predictNeetRank>> & {
    name: string;
    email: string;
    phone: string;
    city: string;
  }
) {
  const { getApiBaseUrl } = await import('@/lib/apiBase');
  const apiUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${apiUrl}/api/forms/neet-rank-predictor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return;
  } catch {
    /* optional in local dev */
  }
  if (process.env.NODE_ENV === 'development') {
    console.info('[neet-rank-predictor] Lead (backend unavailable):', data);
  }
}

export async function POST(req: NextRequest) {
  let body: { token?: string; otp?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const token = body.token?.trim();
  const otp = body.otp?.trim();
  if (!token || !otp || otp.length !== 6) {
    return NextResponse.json({ message: 'Enter the 6-digit OTP' }, { status: 400 });
  }

  const verified = verifyOtpToken(token, otp);
  if (!verified.ok) {
    return NextResponse.json({ message: verified.message }, { status: 400 });
  }

  const prediction = predictNeetRank(verified.data.category, verified.data.score);
  await persistLead({
    ...verified.data,
    ...prediction,
  });

  return NextResponse.json({
    ok: true,
    prediction,
  });
}
