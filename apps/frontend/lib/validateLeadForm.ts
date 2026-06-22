import {
  validateIndianMobile,
  validateLeadEmail,
  DUPLICATE_LEAD_MESSAGE,
  SHEETS_UNAVAILABLE_MESSAGE,
} from '@/lib/leadSubmissionMessages';

const PHONE_KEYS = ['phone', 'mobile', 'phonenumber', 'contact'];
const EMAIL_KEYS = ['email'];

function findFieldValue(fields: Record<string, string>, keys: string[]): string {
  for (const [key, value] of Object.entries(fields)) {
    const normalized = key.toLowerCase().replace(/[\s_-]/g, '');
    if (keys.some((k) => normalized.includes(k.replace(/[\s_-]/g, '')))) {
      return String(value ?? '').trim();
    }
  }
  return '';
}

/** Client-side validation for common lead form field maps. */
export function validateLeadFormFields(
  fields: Record<string, string>
): string | null {
  const email = findFieldValue(fields, EMAIL_KEYS);
  const phone = findFieldValue(fields, PHONE_KEYS);

  if (email) {
    const emailErr = validateLeadEmail(email);
    if (emailErr) return emailErr;
  }

  if (phone) {
    const phoneErr = validateIndianMobile(phone);
    if (phoneErr) return phoneErr;
  }

  return null;
}

export function validateLeadSubmissionData(
  rows: { field: string; value: string }[]
): string | null {
  const map: Record<string, string> = {};
  for (const { field, value } of rows) {
    if (field) map[field] = value;
  }
  return validateLeadFormFields(map);
}

export function leadApiErrorMessage(
  res: Response,
  json: { message?: string; duplicate?: boolean }
): string {
  if (res.status === 409 || json.duplicate) return DUPLICATE_LEAD_MESSAGE;
  if (!res.ok) return json.message || SHEETS_UNAVAILABLE_MESSAGE;
  return json.message || '';
}
