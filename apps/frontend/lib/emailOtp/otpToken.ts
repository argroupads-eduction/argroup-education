import { createHmac, randomInt, timingSafeEqual } from 'crypto';

import { isEmailOtpEnabled } from './isEmailOtpEnabled';

export const EMAIL_OTP_PENDING_TTL_MS = 60 * 1000;
const VERIFIED_TTL_MS = 45 * 60 * 1000;

type PendingPayload = {
  kind: 'pending';
  email: string;
  otp: string;
  exp: number;
};

type VerifiedPayload = {
  kind: 'verified';
  email: string;
  exp: number;
};

function secret(): string {
  return (
    process.env.EMAIL_OTP_SECRET?.trim() ||
    process.env.REVALIDATE_SECRET?.trim() ||
    process.env.NEET_PREDICTOR_OTP_SECRET?.trim() ||
    'email-otp-dev-secret-change-in-production'
  );
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function generateEmailOtp(): string {
  return String(randomInt(100000, 999999));
}

export function createPendingEmailOtpToken(email: string, otp: string): string {
  const body: PendingPayload = {
    kind: 'pending',
    email: normalizeEmail(email),
    otp,
    exp: Date.now() + EMAIL_OTP_PENDING_TTL_MS,
  };
  const payload = Buffer.from(JSON.stringify(body)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function createVerifiedEmailToken(email: string): string {
  const body: VerifiedPayload = {
    kind: 'verified',
    email: normalizeEmail(email),
    exp: Date.now() + VERIFIED_TTL_MS,
  };
  const payload = Buffer.from(JSON.stringify(body)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function parseSignedToken<T>(token: string): T | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

function isDevOtpBypass(otpInput: string): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.EMAIL_OTP_DEV === 'true' &&
    otpInput.trim() === '123456'
  );
}

export function verifyPendingEmailOtp(
  token: string,
  email: string,
  otpInput: string
): { ok: true; verifiedToken: string } | { ok: false; message: string } {
  const parsed = parseSignedToken<PendingPayload>(token);
  if (!parsed || parsed.kind !== 'pending') {
    return { ok: false, message: 'Verification session expired. Please request a new code.' };
  }

  if (Date.now() > parsed.exp) {
    return { ok: false, message: 'This code has expired. Please request a new one.' };
  }

  const normalized = normalizeEmail(email);
  if (parsed.email !== normalized) {
    return { ok: false, message: 'Email does not match this verification code.' };
  }

  if (!isDevOtpBypass(otpInput) && parsed.otp !== otpInput.trim()) {
    return { ok: false, message: 'Incorrect code. Please try again.' };
  }

  return { ok: true, verifiedToken: createVerifiedEmailToken(normalized) };
}

export function verifyEmailVerificationToken(
  email: string,
  verifiedToken: string | undefined
): { ok: true } | { ok: false; message: string } {
  if (!isEmailOtpEnabled()) {
    return { ok: true };
  }

  if (!verifiedToken?.trim()) {
    return { ok: false, message: 'Please verify your email before submitting.' };
  }

  const parsed = parseSignedToken<VerifiedPayload>(verifiedToken);
  if (!parsed || parsed.kind !== 'verified') {
    return { ok: false, message: 'Email verification expired. Please verify again.' };
  }

  if (Date.now() > parsed.exp) {
    return { ok: false, message: 'Email verification expired. Please verify again.' };
  }

  if (parsed.email !== normalizeEmail(email)) {
    return { ok: false, message: 'Verified email does not match the form.' };
  }

  return { ok: true };
}
