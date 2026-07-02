import { NextRequest, NextResponse } from 'next/server';
import { sendEmailOtpMail } from '@backend/lib/emailOtpMail';
import {
  createPendingEmailOtpToken,
  EMAIL_OTP_PENDING_TTL_MS,
  generateEmailOtp,
  isValidEmailFormat,
} from '@/lib/emailOtp/otpToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request' }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email || !isValidEmailFormat(email)) {
    return NextResponse.json({ ok: false, message: 'Please enter a valid email address.' }, { status: 400 });
  }

  const otp = generateEmailOtp();
  const sent = await sendEmailOtpMail(email, otp);

  if (!sent.sent) {
    return NextResponse.json(
      {
        ok: false,
        message: sent.error || 'We could not send the verification email. Please try again.',
      },
      { status: 503 }
    );
  }

  const token = createPendingEmailOtpToken(email, otp);
  const expiresAt = Date.now() + EMAIL_OTP_PENDING_TTL_MS;
  const masked = email.replace(/^(.{2})(.*)(@.*)$/, (_, a, mid, domain) => {
    const hidden = mid.length > 2 ? '*'.repeat(Math.min(mid.length, 6)) : '***';
    return `${a}${hidden}${domain}`;
  });

  return NextResponse.json({
    ok: true,
    token,
    expiresAt,
    expiresInSeconds: Math.ceil(EMAIL_OTP_PENDING_TTL_MS / 1000),
    maskedEmail: masked,
    message: 'Verification code sent to your email. It is valid for 1 minute.',
    ...(process.env.NODE_ENV === 'development' && process.env.EMAIL_OTP_DEV === 'true'
      ? { devHint: 'Dev OTP: 123456 (or check server console)' }
      : {}),
  });
}
