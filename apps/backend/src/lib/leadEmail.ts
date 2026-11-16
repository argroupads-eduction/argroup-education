import nodemailer from 'nodemailer';
import { isSmtpConfigured, loadMonorepoEnv } from './loadMonorepoEnv';

loadMonorepoEnv();

export const DEFAULT_LEADS_NOTIFY_EMAIL = 'argroupads@gmail.com';

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

export function getLeadsNotifyEmail(): string {
  loadMonorepoEnv();
  return process.env.LEADS_NOTIFY_EMAIL?.trim() || DEFAULT_LEADS_NOTIFY_EMAIL;
}

async function sendViaResend(opts: {
  source: string;
  formName?: string;
  fields: Record<string, unknown>;
  pageUrl?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { sent: false, error: 'RESEND_API_KEY not set' };

  const to = getLeadsNotifyEmail();
  const from = process.env.RESEND_FROM?.trim() || 'AR Group Leads <onboarding@resend.dev>';
  const rows = Object.entries(opts.fields)
    .map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(String(v ?? ''))}</td></tr>`)
    .join('');

  const html = `
    <h2>New website lead</h2>
    <p><strong>Form:</strong> ${escapeHtml(opts.formName || opts.source)}</p>
    ${opts.pageUrl ? `<p><strong>Page:</strong> ${escapeHtml(opts.pageUrl)}</p>` : ''}
    <table border="1" cellpadding="8">${rows}</table>
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
        subject: `[AR Group Lead] ${opts.formName || opts.source}`,
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

export async function sendLeadNotificationEmail(opts: {
  source: string;
  formName?: string;
  fields: Record<string, unknown>;
  pageUrl?: string;
}): Promise<{ sent: boolean; error?: string }> {
  loadMonorepoEnv();
  const to = getLeadsNotifyEmail();
  const from =
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    'noreply@argroupeducation.com';

  const rows = Object.entries(opts.fields)
    .map(
      ([key, value]) =>
        `<tr><td style="padding:8px;border:1px solid #e2e8f0;"><strong>${escapeHtml(key)}</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(String(value ?? ''))}</td></tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1a365d;max-width:640px;">
      <h2 style="margin:0 0 12px;">New website lead</h2>
      <p style="margin:0 0 6px;"><strong>Form:</strong> ${escapeHtml(opts.formName || opts.source)}</p>
      <p style="margin:0 0 6px;"><strong>Source:</strong> ${escapeHtml(opts.source)}</p>
      ${opts.pageUrl ? `<p style="margin:0 0 6px;"><strong>Page:</strong> ${escapeHtml(opts.pageUrl)}</p>` : ''}
      <p style="margin:0 0 16px;"><strong>Time (UTC):</strong> ${new Date().toISOString()}</p>
      <table style="border-collapse:collapse;width:100%;">${rows}</table>
    </div>
  `;

  const replyTo =
    typeof opts.fields.email === 'string' && opts.fields.email.includes('@')
      ? opts.fields.email
      : undefined;

  const transporter = getTransporter();
  if (!transporter) {
    const resend = await sendViaResend(opts);
    if (resend.sent) return resend;

    const msg =
      'SMTP not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS to apps/backend/.env (Gmail App Password), or set RESEND_API_KEY.';
    console.warn('[lead-email]', msg, { to, source: opts.source });
    return { sent: false, error: msg };
  }

  try {
    await transporter.sendMail({
      to,
      from,
      replyTo,
      subject: `[AR Group Lead] ${opts.formName || opts.source}`,
      html,
    });
    return { sent: true };
  } catch (err) {
    const smtpError = err instanceof Error ? err.message : String(err);
    const resend = await sendViaResend(opts);
    if (resend.sent) return resend;
    return { sent: false, error: smtpError };
  }
}
