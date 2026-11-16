import { z } from 'zod';

export const PERSON_NAME_MIN_LENGTH = 2;

/** Letters A–Z only; single spaces between words; no digits or punctuation. */
export const PERSON_NAME_REGEX = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;

export const PERSON_NAME_ERROR =
  'Name can only contain letters (no numbers or special characters).';

export function isValidPersonName(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < PERSON_NAME_MIN_LENGTH) return false;
  return PERSON_NAME_REGEX.test(trimmed);
}

export function validatePersonName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Full name is required.';
  if (trimmed.length < PERSON_NAME_MIN_LENGTH) {
    return 'Full name must be at least 2 characters.';
  }
  if (!PERSON_NAME_REGEX.test(trimmed)) return PERSON_NAME_ERROR;
  return null;
}

export function personNameZodString(message = PERSON_NAME_ERROR) {
  return z
    .string()
    .min(PERSON_NAME_MIN_LENGTH, 'Full name is required')
    .refine((v) => PERSON_NAME_REGEX.test(v.trim()), { message });
}

export function isPersonNameField(fieldName?: string | null, label?: string | null): boolean {
  const n = (fieldName ?? '').toLowerCase();
  const l = (label ?? '').toLowerCase();
  if (n.includes('name') && !n.includes('username') && !n.includes('filename')) return true;
  if (/full\s*name|^name$/.test(l)) return true;
  return false;
}

export function validateDynamicFormNames(
  values: Record<string, string>,
  fields: { name?: string | null; label?: string | null }[]
): string | null {
  for (const f of fields) {
    if (!f.name || !isPersonNameField(f.name, f.label)) continue;
    const err = validatePersonName(String(values[f.name] ?? ''));
    if (err) {
      if (err === PERSON_NAME_ERROR) {
        return `${f.label || f.name}: ${PERSON_NAME_ERROR}`;
      }
      return err;
    }
  }
  return null;
}

export function validateSubmissionDataNames(
  submissionData: { field: string; value: string }[]
): string | null {
  for (const { field, value } of submissionData) {
    if (!isPersonNameField(field)) continue;
    const err = validatePersonName(value);
    if (err) return err;
  }
  return null;
}
