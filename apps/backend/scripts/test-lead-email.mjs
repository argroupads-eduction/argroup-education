#!/usr/bin/env node
/**
 * Test lead email delivery to argroupads@gmail.com
 *
 *   node apps/backend/scripts/test-lead-email.mjs
 */
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '../.env') });

const host = process.env.SMTP_HOST?.trim();
const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS?.trim();
const to = process.env.LEADS_NOTIFY_EMAIL?.trim() || 'argroupads@gmail.com';

console.log('SMTP_HOST:', host || '(missing)');
console.log('SMTP_USER:', user || '(missing)');
console.log('SMTP_PASS:', pass ? '***set***' : '(missing)');
console.log('LEADS_NOTIFY_EMAIL:', to);

if (!host || !user || !pass) {
  console.error('\n❌ SMTP not configured in apps/backend/.env');
  console.error('Add Gmail App Password:');
  console.error('  SMTP_HOST=smtp.gmail.com');
  console.error('  SMTP_PORT=587');
  console.error('  SMTP_USER=argroupads@gmail.com');
  console.error('  SMTP_PASS=<16-char App Password>');
  console.error('  LEADS_NOTIFY_EMAIL=argroupads@gmail.com');
  console.error('  SMTP_FROM=AR Group of Education <argroupads@gmail.com>');
  process.exit(1);
}

const nodemailer = (await import('nodemailer')).default;
const port = Number(process.env.SMTP_PORT || 587);
const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  requireTLS: port === 587,
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log('\n✓ SMTP connection OK');
} catch (err) {
  console.error('\n❌ SMTP verify failed:', err.message);
  process.exit(1);
}

const info = await transporter.sendMail({
  from: process.env.SMTP_FROM || user,
  to,
  subject: '[AR Group Lead] Test — form email working',
  html: '<p>If you see this, lead notification emails are working.</p>',
});

console.log('✓ Test email sent:', info.messageId);
console.log('Check inbox (and Spam) for:', to);
