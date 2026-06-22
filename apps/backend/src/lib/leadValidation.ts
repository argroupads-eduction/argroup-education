/** Shared lead field validation (server-side). */

export const INVALID_INDIAN_PHONE_MESSAGE = 'Please enter a valid Indian mobile number.';
export const INVALID_EMAIL_MESSAGE = 'Please enter a valid email address.';

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normalize to 10-digit Indian mobile or null. */
export function normalizeIndianMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return null;
}

export function isValidIndianMobile(raw: string | null | undefined): boolean {
  const normalized = normalizeIndianMobile(raw);
  return normalized !== null && INDIAN_MOBILE_REGEX.test(normalized);
}

export function validateIndianMobile(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return 'Phone number is required.';
  if (!isValidIndianMobile(raw)) return INVALID_INDIAN_PHONE_MESSAGE;
  return null;
}

export function normalizeLeadEmail(email: string | null | undefined): string | null {
  if (!email?.trim()) return null;
  return email.trim().toLowerCase();
}

export function isValidLeadEmail(email: string | null | undefined): boolean {
  const normalized = normalizeLeadEmail(email);
  return normalized !== null && EMAIL_REGEX.test(normalized);
}

export function validateLeadEmail(email: string | null | undefined): string | null {
  if (!email?.trim()) return 'Email is required.';
  if (!isValidLeadEmail(email)) return INVALID_EMAIL_MESSAGE;
  return null;
}

/** Strip control chars and trim; limit length for Sheets safety. */
export function sanitizeLeadText(value: unknown, maxLen = 500): string {
  if (value === null || value === undefined) return '';
  const s = String(value)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}
