/**
 * Client-safe lead messages and validation (no @backend imports).
 * Server API routes import validation from @backend/lib/leadValidation directly.
 */

export const INVALID_INDIAN_PHONE_MESSAGE = 'Please enter a valid Indian mobile number.';
export const INVALID_EMAIL_MESSAGE = 'Please enter a valid email address.';

export const DUPLICATE_LEAD_MESSAGE =
  'We have already received your enquiry. Our counselling team will contact you shortly. For urgent assistance please call our support team.';

export const SUCCESS_LEAD_MESSAGE =
  'Thank you for contacting AR Group of Education. Our counselling team will contact you shortly.';

export const SHEETS_UNAVAILABLE_MESSAGE =
  'We are unable to process your enquiry right now. Please try again later.';

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function isValidLeadEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

export function validateLeadEmail(email: string | null | undefined): string | null {
  if (!email?.trim()) return 'Email is required.';
  if (!isValidLeadEmail(email)) return INVALID_EMAIL_MESSAGE;
  return null;
}
