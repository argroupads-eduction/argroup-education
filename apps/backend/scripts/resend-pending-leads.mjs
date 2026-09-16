#!/usr/bin/env node
/**
 * Resend lead emails saved with emailSent=false (after SMTP is configured).
 *   node apps/backend/scripts/resend-pending-leads.mjs
 */
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendLeadEmail(lead) {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const to = process.env.LEADS_NOTIFY_EMAIL?.trim() || 'argroupads@gmail.com';

  if (!host || !user || !pass) {
    return { sent: false, error: 'SMTP not configured in apps/backend/.env' };
  }

  const fields = lead.fields && typeof lead.fields === 'object' ? lead.fields : {};
  const rows = Object.entries(fields)
    .map(
      ([k, v]) =>
        `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(v ?? '')}</td></tr>`
    )
    .join('');

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM?.trim() || user,
    to,
    replyTo: lead.email || undefined,
    subject: `[AR Group Lead] ${lead.formName || lead.source}`,
    html: `
      <h2>New website lead (resent)</h2>
      <p><strong>Form:</strong> ${escapeHtml(lead.formName || lead.source)}</p>
      <p><strong>Submitted:</strong> ${lead.createdAt.toISOString()}</p>
      <table border="1" cellpadding="8">${rows}</table>
    `,
  });

  return { sent: true };
}

async function main() {
  const pending = await prisma.websiteFormLead.findMany({
    where: { emailSent: false },
    orderBy: { createdAt: 'asc' },
  });

  if (pending.length === 0) {
    console.log('No pending leads.');
    return;
  }

  console.log(`Resending ${pending.length} lead email(s)…`);

  for (const lead of pending) {
    try {
      const result = await sendLeadEmail(lead);
      await prisma.websiteFormLead.update({
        where: { id: lead.id },
        data: { emailSent: result.sent, emailError: result.error ?? null },
      });
      console.log(
        result.sent
          ? `✓ ${lead.source} — ${lead.name || lead.email}`
          : `✗ ${lead.source} — ${result.error}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.websiteFormLead.update({
        where: { id: lead.id },
        data: { emailError: msg },
      });
      console.log(`✗ ${lead.source} — ${msg}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
