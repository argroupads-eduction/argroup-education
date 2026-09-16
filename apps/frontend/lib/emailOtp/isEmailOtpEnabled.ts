/**
 * Email OTP on website forms. Temporarily off — set NEXT_PUBLIC_EMAIL_OTP_ENABLED=true to re-enable.
 */
export function isEmailOtpEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EMAIL_OTP_ENABLED === 'true';
}

/** Initial verified state for form components when OTP is disabled. */
export const emailOtpInitiallyVerified = !isEmailOtpEnabled();
