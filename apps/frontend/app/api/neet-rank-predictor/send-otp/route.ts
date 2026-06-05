import { NextRequest, NextResponse } from 'next/server';
import { NEET_CATEGORIES } from '@/lib/neetRankPredictor/data';
import { createOtpToken, generateOtp, sendOtpSms } from '@/lib/neetRankPredictor/otpToken';
import type { NeetCategory, NeetPredictorLeadPayload } from '@/lib/neetRankPredictor/types';

export const dynamic = 'force-dynamic';

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return null;
}

export async function POST(req: NextRequest) {
  let body: Partial<NeetPredictorLeadPayload>;
  try {
    body = (await req.json()) as Partial<NeetPredictorLeadPayload>;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const city = body.city?.trim();
  const phone = normalizePhone(body.phone ?? '');
  const category = body.category;
  const score = Number(body.score);

  if (!name || name.length < 2) {
    return NextResponse.json({ message: 'Enter your full name' }, { status: 400 });
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

  const payload: NeetPredictorLeadPayload = {
    name,
    email,
    phone,
    city,
    category: category as NeetCategory,
    score: Math.round(score),
  };

  const otp = generateOtp();
  await sendOtpSms(phone, otp);
  const token = createOtpToken(payload, otp);

  const res = NextResponse.json({
    ok: true,
    token,
    maskedPhone: `+91 ${phone.slice(0, 2)}****${phone.slice(-4)}`,
    message: 'OTP sent to your mobile',
    ...(process.env.NODE_ENV === 'development' && process.env.NEET_PREDICTOR_OTP_DEV === 'true'
      ? { devHint: 'Dev OTP: 123456 (or check server console)' }
      : {}),
  });

  return res;
}
