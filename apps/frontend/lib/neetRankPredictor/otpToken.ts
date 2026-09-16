import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import type { NeetPredictorLeadPayload } from './types';

const OTP_TTL_MS = 10 * 60 * 1000;

type OtpPayload = NeetPredictorLeadPayload & {
  otp: string;
  exp: number;
};

function secret(): string {
  return (
    process.env.NEET_PREDICTOR_OTP_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    'neet-predictor-dev-secret-change-in-production'
  );
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export function createOtpToken(data: NeetPredictorLeadPayload, otp: string): string {
  const body: OtpPayload = {
    ...data,
    otp,
    exp: Date.now() + OTP_TTL_MS,
  };
  const payload = Buffer.from(JSON.stringify(body)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyOtpToken(
  token: string,
  otpInput: string
): { ok: true; data: NeetPredictorLeadPayload } | { ok: false; message: string } {
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, message: 'Invalid session' };
  const [payload, sig] = parts;
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, message: 'Invalid session' };
    }
  } catch {
    return { ok: false, message: 'Invalid session' };
  }

  let parsed: OtpPayload;
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as OtpPayload;
  } catch {
    return { ok: false, message: 'Invalid session' };
  }

  if (Date.now() > parsed.exp) return { ok: false, message: 'OTP expired. Please request a new code.' };

  const devBypass =
    process.env.NODE_ENV === 'development' &&
    process.env.NEET_PREDICTOR_OTP_DEV === 'true' &&
    otpInput === '123456';

  if (!devBypass && parsed.otp !== otpInput.trim()) {
    return { ok: false, message: 'Incorrect OTP. Please try again.' };
  }

  const { name, email, phone, city, category, score } = parsed;
  return { ok: true, data: { name, email, phone, city, category, score } };
}

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  const provider = process.env.NEET_PREDICTOR_SMS_WEBHOOK_URL?.trim();
  if (provider) {
    await fetch(provider, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, template: 'neet_rank_predictor' }),
      signal: AbortSignal.timeout(8000),
    }).catch(() => {
      /* logged below in dev */
    });
    return;
  }
  if (process.env.NODE_ENV === 'development') {
    console.info(`[neet-rank-predictor] OTP for ${phone}: ${otp}`);
  }
}
