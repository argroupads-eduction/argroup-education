import nodemailer from 'nodemailer';
import { isSmtpConfigured, loadMonorepoEnv } from './loadMonorepoEnv';

loadMonorepoEnv();

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTransporter() {
  if (!isSmtpConfigured()) return null;

  const host = process.env.SMTP_HOST!.trim();
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim();
  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
  });
}

async function sendViaResendOtp(to: string, otp: string): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { sent: false, error: 'RESEND_API_KEY not set' };

  const from =
    process.env.RESEND_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    'AR Group of Education <onboarding@resend.dev>';

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1a365d;max-width:480px;margin:0 auto;">
      <h2 style="margin:0 0 12px;color:#051219;">Verify your email</h2>
      <p style="margin:0 0 16px;line-height:1.6;color:#334155;">
        Use this one-time code to verify your email on AR Group of Education. It expires in 1 minute.
      </p>
      <p style="margin:0 0 20px;font-size:28px;font-weight:800;letter-spacing:0.2em;color:#f59e0b;">${escapeHtml(otp)}</p>
      <p style="margin:0;font-size:13px;color:#64748b;">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `${otp} is your AR Group verification code`,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { sent: false, error: `Resend ${res.status}: ${text.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Sends a 6-digit OTP to the visitor's email (form verification). */
export async function sendEmailOtpMail(
  to: string,
  otp: string
): Promise<{ sent: boolean; error?: string }> {
  loadMonorepoEnv();

  const from =
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    'AR Group of Education <noreply@argroupofeducation.com>';

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1a365d;max-width:480px;margin:0 auto;">
      <h2 style="margin:0 0 12px;color:#051219;">Verify your email</h2>
      <p style="margin:0 0 16px;line-height:1.6;color:#334155;">
        Use this one-time code to verify your email on AR Group of Education. It expires in 1 minute.
      </p>
      <p style="margin:0 0 20px;font-size:28px;font-weight:800;letter-spacing:0.2em;color:#f59e0b;">${escapeHtml(otp)}</p>
      <p style="margin:0;font-size:13px;color:#64748b;">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    const resend = await sendViaResendOtp(to, otp);
    if (resend.sent) return resend;

    if (process.env.NODE_ENV === 'development') {
      console.info(`[email-otp] OTP for ${to}: ${otp}`);
      return { sent: true };
    }

    return {
      sent: false,
      error: 'Email service is temporarily unavailable. Please try again shortly.',
    };
  }

  try {
    await transporter.sendMail({
      to,
      from,
      subject: `${otp} is your AR Group verification code`,
      html,
    });
    return { sent: true };
  } catch (err) {
    const resend = await sendViaResendOtp(to, otp);
    if (resend.sent) return resend;
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}
