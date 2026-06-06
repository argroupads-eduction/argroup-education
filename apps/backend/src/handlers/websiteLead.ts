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

async function sendLeadEmailWithRetry(opts: {
  source: string;
  formName?: string;
  fields: Record<string, unknown>;
  pageUrl?: string;
}) {
  let result = await sendLeadNotificationEmail(opts);
  if (result.sent) return result;

  for (let attempt = 1; attempt <= 2; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, attempt * 800));
    result = await sendLeadNotificationEmail(opts);
    if (result.sent) return result;
  }
  return result;
}

export async function submitWebsiteLead(input: WebsiteLeadInput) {
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

  const emailResult = await sendLeadEmailWithRetry({
    source: input.source,
    formName: input.formName,
    fields,
    pageUrl: input.pageUrl,
  });

  await withPrismaRetry(() =>
    prisma.websiteFormLead.update({
      where: { id: lead.id },
      data: {
        emailSent: emailResult.sent,
        emailError: emailResult.error ?? null,
      },
    })
  );

  if (!emailResult.sent && process.env.NODE_ENV !== 'development') {
    console.error('[website-lead] email failed:', emailResult.error, { leadId: lead.id });
  }

  return {
    ok: true as const,
    status: 201,
    id: lead.id,
    emailSent: emailResult.sent,
    message: 'Thank you! We received your details and will contact you soon.',
  };
}
