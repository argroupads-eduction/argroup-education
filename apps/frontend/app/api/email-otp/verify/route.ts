import { NextRequest, NextResponse } from 'next/server';
import { verifyPendingEmailOtp } from '@/lib/emailOtp/otpToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { email?: string; otp?: string; token?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request' }, { status: 400 });
  }

  const email = body.email?.trim();
  const otp = body.otp?.trim();
  const token = body.token?.trim();

  if (!email || !otp || otp.length !== 6 || !token) {
    return NextResponse.json({ ok: false, message: 'Enter the 6-digit code from your email.' }, { status: 400 });
  }

  const result = verifyPendingEmailOtp(token, email, otp);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    verifiedToken: result.verifiedToken,
    message: 'Email verified successfully.',
  });
}
