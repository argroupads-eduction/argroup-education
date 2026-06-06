import { prisma, withPrismaRetry } from '../lib/prisma';
import { sendLeadNotificationEmail } from '../lib/leadEmail';

export type WebsiteLeadInput = {
  source: string;
  formName?: string;
  fields: Record<string, unknown>;
  pageUrl?: string;
  userAgent?: string;
};

function pickString(fields: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = fields[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function normalizeLeadFields(
  fields: Record<string, unknown> | { field: string; value: string }[]
): Record<string, unknown> {
  if (Array.isArray(fields)) {
    const map: Record<string, unknown> = {};
    for (const { field, value } of fields) {
      if (field) map[field] = value;
    }
    return map;
  }
  return fields;
}

export function extractLeadContact(fields: Record<string, unknown>) {
  return {
    name: pickString(fields, ['fullName', 'full_name', 'name']),
    email: pickString(fields, ['email']),
    phone: pickString(fields, ['phone', 'mobile', 'phoneNumber', 'contact']),
  };
}

const EMAIL_RETRY_DELAYS_MS = [400, 900, 1800, 3600, 7200];

export async function sendLeadEmailWithRetry(opts: {
  source: string;
  formName?: string;
  fields: Record<string, unknown>;
  pageUrl?: string;
}) {
  let result = await sendLeadNotificationEmail(opts);
  if (result.sent) return result;

  for (const delay of EMAIL_RETRY_DELAYS_MS) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    result = await sendLeadNotificationEmail(opts);
    if (result.sent) return result;
  }
  return result;
}

/** Send email for an existing WebsiteFormLead row (cron / deferred delivery). */
export async function completeLeadEmailDelivery(leadId: string): Promise<boolean> {
  const lead = await withPrismaRetry(() =>
    prisma.websiteFormLead.findUnique({ where: { id: leadId } })
  );
  if (!lead || lead.emailSent) return lead?.emailSent ?? false;

  const fields =
    lead.fields && typeof lead.fields === 'object' && !Array.isArray(lead.fields)
      ? (lead.fields as Record<string, unknown>)
      : {};

  const emailResult = await sendLeadEmailWithRetry({
    source: lead.source,
    formName: lead.formName ?? undefined,
    fields,
    pageUrl: lead.pageUrl ?? undefined,
  });

  await withPrismaRetry(() =>
    prisma.websiteFormLead.update({
      where: { id: leadId },
      data: {
        emailSent: emailResult.sent,
        emailError: emailResult.error ?? null,
      },
    })
  );

  if (!emailResult.sent) {
    console.error('[website-lead] email failed:', emailResult.error, { leadId });
  }

  return emailResult.sent;
}

/** Resend all leads where DB save succeeded but email did not. */
export async function resendPendingLeadEmails(limit = 50): Promise<{ sent: number; failed: number }> {
  const pending = await withPrismaRetry(() =>
    prisma.websiteFormLead.findMany({
      where: { emailSent: false },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
  );

  let sent = 0;
  let failed = 0;
  for (const lead of pending) {
    const ok = await completeLeadEmailDelivery(lead.id);
    if (ok) sent += 1;
    else failed += 1;
  }
  return { sent, failed };
}

export async function submitWebsiteLead(
  input: WebsiteLeadInput,
  options?: { deferEmail?: boolean }
) {
  const fields = normalizeLeadFields(input.fields);
  if (Object.keys(fields).length === 0) {
    return { ok: false as const, status: 400, message: 'Form fields are required' };
  }

  const { name, email, phone } = extractLeadContact(fields);

  const lead = await withPrismaRetry(() =>
    prisma.websiteFormLead.create({
      data: {
        source: input.source,
        formName: input.formName ?? null,
        name,
        email,
        phone,
        pageUrl: input.pageUrl ?? null,
        userAgent: input.userAgent ?? null,
        fields: fields as object,
      },
    })
  );

  if (options?.deferEmail) {
    return {
      ok: true as const,
      status: 201,
      id: lead.id,
      emailSent: false,
      emailDeferred: true,
      message: 'Thank you! We received your details and will contact you soon.',
    };
  }

  const emailSent = await completeLeadEmailDelivery(lead.id);

  return {
    ok: true as const,
    status: 201,
    id: lead.id,
    emailSent,
    emailDeferred: false,
    message: 'Thank you! We received your details and will contact you soon.',
  };
}
