'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import '@/styles/email-otp-verification.css';

export type EmailOtpVerificationProps = {
  email: string;
  onVerifiedChange: (state: { verified: boolean; verifiedToken: string | null }) => void;
  variant?: 'light' | 'dark';
  className?: string;
  /** When true, show OTP UI after email field blur */
  activateOnBlur?: boolean;
  /** Parent sets true after email input blur */
  activated?: boolean;
  /** Auto-send OTP when section becomes visible (default: true) */
  autoSend?: boolean;
};

const OTP_SEND_TIMEOUT_MS = 25_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_LENGTH = 6;

function formatCountdown(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function otpToDigits(value: string): string[] {
  const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
  while (digits.length < OTP_LENGTH) digits.push('');
  return digits;
}

function digitsToOtp(digits: string[]): string {
  return digits.join('').replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export function EmailOtpVerification({
  email,
  onVerifiedChange,
  variant = 'light',
  className,
  activateOnBlur = true,
  activated: activatedProp,
  autoSend = true,
}: EmailOtpVerificationProps) {
  const otpInputId = useId();
  const digitRefs = useRef<Array<HTMLInputElement | null>>([]);
  const autoSendAttemptedRef = useRef<string | null>(null);
  const prevEmailRef = useRef<string | null>(null);
  const sendAbortRef = useRef<AbortController | null>(null);
  const onVerifiedChangeRef = useRef(onVerifiedChange);

  onVerifiedChangeRef.current = onVerifiedChange;

  const [activatedInternal, setActivatedInternal] = useState(!activateOnBlur);
  const activated = activatedProp ?? activatedInternal;

  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(() => otpToDigits(''));
  const [verified, setVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = EMAIL_RE.test(normalizedEmail);
  const otp = digitsToOtp(otpDigits);
  const showOtpEntry = Boolean(pendingToken) || sending;
  const isDark = variant === 'dark';

  const notifyParent = useCallback((state: { verified: boolean; verifiedToken: string | null }) => {
    onVerifiedChangeRef.current(state);
  }, []);

  const resetVerification = useCallback(() => {
    sendAbortRef.current?.abort();
    sendAbortRef.current = null;
    setSending(false);
    setVerified(false);
    setPendingToken(null);
    setOtpDigits(otpToDigits(''));
    setStatusMessage(null);
    setError(null);
    setExpiresAt(null);
    setSecondsLeft(0);
    setOtpExpired(false);
    autoSendAttemptedRef.current = null;
    notifyParent({ verified: false, verifiedToken: null });
  }, [notifyParent]);

  const sendOtp = useCallback(
    async (options?: { isResend?: boolean }) => {
      if (!emailValid) {
        setError('Enter a valid email address first.');
        return;
      }

      if (sending) return;

      sendAbortRef.current?.abort();
      const controller = new AbortController();
      sendAbortRef.current = controller;
      const timeoutId = window.setTimeout(() => controller.abort(), OTP_SEND_TIMEOUT_MS);

      setSending(true);
      setError(null);
      if (options?.isResend) {
        setStatusMessage(null);
        setOtpDigits(otpToDigits(''));
      }
      setOtpExpired(false);

      try {
        const res = await fetch('/api/email-otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail }),
          signal: controller.signal,
        });
        const data = (await res.json()) as {
          ok?: boolean;
          token?: string;
          expiresAt?: number;
          expiresInSeconds?: number;
          message?: string;
          devHint?: string;
        };

        if (controller.signal.aborted) return;

        if (!res.ok || !data.ok || !data.token) {
          setError(
            data.message ||
              (res.status === 503
                ? 'Could not send the code right now. Tap “Send verification code” to try again.'
                : 'Could not send verification code. Please try again.')
          );
          return;
        }

        setPendingToken(data.token);
        const expiry =
          typeof data.expiresAt === 'number'
            ? data.expiresAt
            : Date.now() + (data.expiresInSeconds ?? 60) * 1000;
        setExpiresAt(expiry);
        setSecondsLeft(Math.max(1, Math.ceil((expiry - Date.now()) / 1000)));
        setActivatedInternal(true);
        autoSendAttemptedRef.current = normalizedEmail;
        setStatusMessage(
          options?.isResend
            ? 'New code sent! Check your inbox.'
            : data.devHint || 'Code sent! Check your inbox.'
        );
        window.setTimeout(() => digitRefs.current[0]?.focus(), 80);
      } catch (err) {
        if (controller.signal.aborted) {
          if (sendAbortRef.current === controller) {
            setError('Sending timed out. Please tap “Send verification code” to try again.');
          }
          return;
        }
        setError('Could not send verification code. Please try again.');
      } finally {
        window.clearTimeout(timeoutId);
        if (sendAbortRef.current === controller) {
          sendAbortRef.current = null;
        }
        setSending(false);
      }
    },
    [emailValid, normalizedEmail, sending]
  );

  const verifyOtp = useCallback(async () => {
    if (otpExpired) {
      setError('This code has expired. Please request a new one.');
      return;
    }
    if (!pendingToken) {
      setError('Please wait for the verification code.');
      return;
    }
    if (otp.length !== OTP_LENGTH) {
      setError('Enter the complete 6-digit code.');
      return;
    }

    setVerifying(true);
    setError(null);
    try {
      const res = await fetch('/api/email-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, otp, token: pendingToken }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        verifiedToken?: string;
        message?: string;
      };
      if (!res.ok || !data.ok || !data.verifiedToken) {
        setError(data.message || 'Incorrect code. Please try again.');
        return;
      }
      setVerified(true);
      setStatusMessage('Email verified successfully.');
      notifyParent({ verified: true, verifiedToken: data.verifiedToken });
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  }, [normalizedEmail, notifyParent, otp, otpExpired, pendingToken]);

  useEffect(() => {
    if (!expiresAt || verified) return;

    const tick = () => {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        setOtpExpired(true);
        setError('Code expired. Tap Resend to get a new code.');
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt, verified]);

  // Reset only when the email address actually changes — not on every parent re-render.
  useEffect(() => {
    if (prevEmailRef.current === normalizedEmail) return;
    prevEmailRef.current = normalizedEmail;
    resetVerification();
    if (!activateOnBlur) setActivatedInternal(true);
    else setActivatedInternal(false);
  }, [normalizedEmail, activateOnBlur, resetVerification]);

  useEffect(() => {
    if (!autoSend || !activated || !emailValid || verified || pendingToken) return;
    if (autoSendAttemptedRef.current === normalizedEmail) return;

    autoSendAttemptedRef.current = normalizedEmail;
    void sendOtp();
  }, [autoSend, activated, emailValid, verified, pendingToken, normalizedEmail, sendOtp]);

  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const onDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (otp.length === OTP_LENGTH && !otpExpired && !verifying) {
        void verifyOtp();
      }
    }
  };

  const onDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    setOtpDigits(otpToDigits(pasted));
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    digitRefs.current[focusIndex]?.focus();
  };

  if (!emailValid) return null;
  if (activateOnBlur && !activated) return null;

  return (
    <div
      className={clsx(
        'email-otp-card w-full min-w-0 max-w-full',
        isDark && 'email-otp-card--dark',
        className
      )}
      aria-live="polite"
    >
      <div className="email-otp-card__glow" aria-hidden />

      {verified ? (
        <div className="email-otp-verified">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
          <span className="email-otp-verified__text">Email verified</span>
        </div>
      ) : (
        <>
          <div className="email-otp-card__head">
            <div className="email-otp-card__title-wrap">
              <div className="email-otp-card__icon" aria-hidden>
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="email-otp-card__title">Secure email verification</p>
                <p className="email-otp-card__subtitle">
                  {sending
                    ? 'Sending 6-digit code to'
                    : pendingToken
                      ? 'Enter the code sent to'
                      : 'We will verify before submit'}
                </p>
                <p className="email-otp-card__email-line">{normalizedEmail}</p>
              </div>
            </div>

            {pendingToken && !otpExpired ? (
              <div
                className={clsx('email-otp-timer', secondsLeft <= 15 && 'email-otp-timer--urgent')}
                aria-label={`Code expires in ${formatCountdown(secondsLeft)}`}
              >
                <span className="email-otp-timer__value">{formatCountdown(secondsLeft)}</span>
                <span className="email-otp-timer__label">Expires</span>
              </div>
            ) : null}
          </div>

          {sending && !pendingToken ? (
            <div className="email-otp-sending">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-600" aria-hidden />
              <span className="email-otp-sending__text">Sending verification code…</span>
            </div>
          ) : null}

          {!pendingToken && !sending && error ? (
            <div className="email-otp-actions">
              <button
                type="button"
                onClick={() => {
                  autoSendAttemptedRef.current = null;
                  void sendOtp({ isResend: true });
                }}
                className="program-hub-btn-primary email-otp-verify-btn inline-flex items-center justify-center gap-1.5 text-xs"
              >
                Send verification code
              </button>
            </div>
          ) : null}

          {showOtpEntry && pendingToken ? (
            <>
              <div className="email-otp-digits" role="group" aria-label="6-digit verification code">
                {otpDigits.map((digit, index) => (
                  <input
                    key={`${otpInputId}-${index}`}
                    ref={(el) => {
                      digitRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={digit}
                    disabled={otpExpired || verifying}
                    onChange={(e) => updateDigit(index, e.target.value)}
                    onKeyDown={(e) => onDigitKeyDown(index, e)}
                    onPaste={onDigitPaste}
                    className="email-otp-digit"
                    aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                  />
                ))}
              </div>

              <div className="email-otp-actions">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void verifyOtp();
                  }}
                  disabled={verifying || otp.length !== OTP_LENGTH || otpExpired}
                  className="program-hub-btn-primary email-otp-verify-btn inline-flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
                >
                  {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Verify email
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    autoSendAttemptedRef.current = null;
                    void sendOtp({ isResend: true });
                  }}
                  disabled={sending || verifying}
                  className="email-otp-resend-btn"
                >
                  {sending ? 'Sending…' : otpExpired ? 'Resend new code' : 'Resend code'}
                </button>
              </div>
            </>
          ) : null}

          {statusMessage && !error ? (
            <p className="email-otp-status email-otp-status--success">{statusMessage}</p>
          ) : null}
          {error ? <p className="email-otp-status email-otp-status--error">{error}</p> : null}
        </>
      )}
    </div>
  );
}
