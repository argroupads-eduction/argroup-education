import { extractEmailFromFields } from './extractEmail';
import { verifyEmailVerificationToken } from './otpToken';

type FieldsInput = Record<string, unknown> | { field: string; value: string }[] | undefined;

export function requireVerifiedEmailForSubmit(
  fields: FieldsInput,
  emailVerificationToken: string | undefined
): { ok: true; email: string } | { ok: false; message: string; status: number } {
  const email = extractEmailFromFields(fields);
  if (!email) {
    return { ok: false, message: 'A valid email address is required.', status: 400 };
  }

  const verified = verifyEmailVerificationToken(email, emailVerificationToken);
  if (!verified.ok) {
    return { ok: false, message: verified.message, status: 403 };
  }

  return { ok: true, email };
}
