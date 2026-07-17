import { prisma, withPrismaRetry } from '../lib/prisma';
import { isDatabaseUnavailableError } from '../lib/neonDatabaseUrl';
import { sendLeadNotificationEmail } from '../lib/leadEmail';
import {
  isGoogleSheetsLeadEnabled,
  submitWebsiteLeadToGoogleSheets,
  SHEETS_UNAVAILABLE_MESSAGE,
} from '../lib/googleSheetsLead';
import { resolveLeadCourseSheet } from '../lib/leadCourseRouting';
import {
  normalizeIndianMobile,
  normalizeLeadEmail as normalizeEmailKey,
  validateIndianMobile,
  validateLeadEmail,
} from '../lib/leadValidation';

export const DUPLICATE_LEAD_MESSAGE =
  'We have already received your enquiry. Our counselling team will contact you shortly. For urgent assistance please call our support team.';

export const SUCCESS_LEAD_MESSAGE =
  'Thank you for contacting AR Group of Education. Our counselling team will contact you shortly.';

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

/** Lowercase trimmed email for deduplication. */
export function normalizeLeadEmail(email: string | null | undefined): string | null {
  return normalizeEmailKey(email);
}

/** Last 10 digits (India mobiles) for deduplication. */
export function normalizeLeadPhoneKey(phone: string | null | undefined): string | null {
  return normalizeIndianMobile(phone);
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

/** Schema ahead of DB (emailKey / phoneKey not migrated yet). */
function isMissingLeadKeyColumns(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = 'code' in error ? String((error as { code: string }).code) : '';
  const msg = 'message' in error ? String((error as { message: string }).message) : '';
  return (
    code === 'P2022' ||
    /emailKey|phoneKey|Unknown column/i.test(msg)
  );
}

/** True when the same email or phone already submitted any website form. */
export async function isDuplicateWebsiteLead(
  email: string | null | undefined,
  phone: string | null | undefined
): Promise<boolean> {
  const emailKey = normalizeLeadEmail(email);
  const phoneKey = normalizeLeadPhoneKey(phone);
  if (!emailKey && !phoneKey) return false;

  try {
    if (emailKey) {
      const byEmail = await withPrismaRetry(() =>
        prisma.websiteFormLead.findFirst({
          where: { emailKey },
          select: { id: true },
        })
      );
      if (byEmail) return true;
    }

    if (phoneKey) {
      const byPhone = await withPrismaRetry(() =>
        prisma.websiteFormLead.findFirst({
          where: { phoneKey },
          select: { id: true },
        })
      );
      if (byPhone) return true;
    }
  } catch (error) {
    if (!isMissingLeadKeyColumns(error)) throw error;

    if (emailKey) {
      const legacyEmail = await withPrismaRetry(() =>
        prisma.websiteFormLead.findFirst({
          where: { email: { equals: emailKey, mode: 'insensitive' } },
          select: { id: true },
        })
      );
      if (legacyEmail) return true;
    }

    if (phoneKey) {
      const legacy = await withPrismaRetry(() =>
        prisma.websiteFormLead.findMany({
          select: { id: true, phone: true },
          orderBy: { createdAt: 'desc' },
          take: 200,
        })
      );
      if (legacy.some((row) => normalizeLeadPhoneKey(row.phone) === phoneKey)) return true;
    }
  }

  return false;
}

function pickLeadField(fields: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = fields[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function buildSheetPayloadFromLead(
  input: WebsiteLeadInput,
  fields: Record<string, unknown>,
  contact: { name: string | null; email: string | null; phone: string | null }
) {
  const messageParts = [
    pickLeadField(fields, ['message']),
    pickLeadField(fields, ['subject']),
    pickLeadField(fields, ['neetScore', 'examScore', 'score']),
    pickLeadField(fields, ['preferredDate']),
    (() => {
      const category = pickLeadField(fields, ['category', 'reservation', 'caste']);
      return category ? `Category: ${category}` : '';
    })(),
  ].filter(Boolean);

  const routing = resolveLeadCourseSheet({
    source: input.source,
    formName: input.formName,
    pageUrl: input.pageUrl,
    fields,
  });

  return {
    name: contact.name || pickLeadField(fields, ['fullName', 'full_name', 'name']) || 'Unknown',
    phone: contact.phone || pickLeadField(fields, ['phone', 'mobile', 'phoneNumber', 'contact']),
    email: contact.email || pickLeadField(fields, ['email']),
    city: pickLeadField(fields, ['city']),
    state: pickLeadField(fields, ['state']),
    country: routing.country,
    course: routing.courseLabel,
    sheetKey: routing.sheetName,
    source: input.source,
    sourcePage: input.pageUrl ?? '',
    formType: input.formName || input.source,
    message: messageParts.join(' | '),
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
  options?: { deferEmail?: boolean; requestId?: string; skipGoogleSheets?: boolean }
) {
  const fields = normalizeLeadFields(input.fields);
  if (Object.keys(fields).length === 0) {
    return { ok: false as const, status: 400, message: 'Form fields are required' };
  }

  const { name, email, phone } = extractLeadContact(fields);
  const emailKey = normalizeLeadEmail(email);
  const phoneKey = normalizeLeadPhoneKey(phone);

  if (email) {
    const emailErr = validateLeadEmail(email);
    if (emailErr) {
      return { ok: false as const, status: 400, message: emailErr };
    }
  }

  if (phone) {
    const phoneErr = validateIndianMobile(phone);
    if (phoneErr) {
      return { ok: false as const, status: 400, message: phoneErr };
    }
  }

  const sheetsEnabled = isGoogleSheetsLeadEnabled() && !options?.skipGoogleSheets;
  let sheetsLeadId: string | undefined;

  if (sheetsEnabled) {
    const sheetPayload = buildSheetPayloadFromLead(input, fields, { name, email, phone });
    if (!sheetPayload.email) {
      return { ok: false as const, status: 400, message: 'Email is required.' };
    }

    const sheetsResult = await submitWebsiteLeadToGoogleSheets(sheetPayload, {
      requestId: options?.requestId,
    });

    if (sheetsResult.duplicate) {
      return {
        ok: false as const,
        status: 409,
        duplicate: true as const,
        message: DUPLICATE_LEAD_MESSAGE,
      };
    }

    if (sheetsResult.ok) {
      sheetsLeadId = sheetsResult.leadId;
      // Sheets is primary storage — return success without requiring Neon/Supabase write.
      return {
        ok: true as const,
        status: 201,
        id: sheetsLeadId ?? `sheets-${Date.now()}`,
        emailSent: false,
        emailDeferred: false,
        sheetsSaved: true as const,
        skipEmail: true as const,
        message: SUCCESS_LEAD_MESSAGE,
      };
    } else {
      console.error('[website-lead] Google Sheets failed — email fallback:', sheetsResult.message);

      const emailResult = await sendLeadEmailWithRetry({
        source: input.source,
        formName: input.formName,
        fields: {
          ...fields,
          _sheetsError: sheetsResult.message || SHEETS_UNAVAILABLE_MESSAGE,
          _targetSheet: sheetPayload.sheetKey,
        },
        pageUrl: input.pageUrl,
      });

      if (!emailResult.sent) {
        return {
          ok: false as const,
          status: 503,
          message: SHEETS_UNAVAILABLE_MESSAGE,
        };
      }

      return {
        ok: true as const,
        status: 201,
        id: `email-fallback-${Date.now()}`,
        emailSent: true,
        emailFallback: true as const,
        skipEmail: true as const,
        message: SUCCESS_LEAD_MESSAGE,
      };
    }
  } else {
    try {
      if (await isDuplicateWebsiteLead(email, phone)) {
        return {
          ok: false as const,
          status: 409,
          duplicate: true as const,
          message: DUPLICATE_LEAD_MESSAGE,
        };
      }
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) throw error;
      console.warn('[website-lead] duplicate check skipped (DB unavailable)');
    }
  }

  let lead;
  const baseData = {
    source: input.source,
    formName: input.formName ?? null,
    name,
    email,
    phone,
    pageUrl: input.pageUrl ?? null,
    userAgent: input.userAgent ?? null,
    fields: fields as object,
  };

  try {
    try {
      lead = await withPrismaRetry(() =>
        prisma.websiteFormLead.create({
          data: {
            ...baseData,
            emailKey,
            phoneKey,
          },
        })
      );
    } catch (error) {
      if (isMissingLeadKeyColumns(error)) {
        lead = await withPrismaRetry(() =>
          prisma.websiteFormLead.create({
            data: baseData,
          })
        );
      } else if ((emailKey || phoneKey) && isPrismaUniqueViolation(error)) {
        return {
          ok: false as const,
          status: 409,
          duplicate: true as const,
          message: DUPLICATE_LEAD_MESSAGE,
        };
      } else {
        throw error;
      }
    }
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) throw error;
    console.warn('[website-lead] DB save failed:', error);

    const emailResult = await sendLeadEmailWithRetry({
      source: input.source,
      formName: input.formName,
      fields,
      pageUrl: input.pageUrl,
    });

    if (!emailResult.sent) {
      return {
        ok: false as const,
        status: 503,
        message: SHEETS_UNAVAILABLE_MESSAGE,
      };
    }

    return {
      ok: true as const,
      status: 201,
      id: `email-${Date.now()}`,
      emailSent: true,
      emailDeferred: false,
      emailOnly: true as const,
      skipEmail: true as const,
      message: SUCCESS_LEAD_MESSAGE,
    };
  }

  if (options?.deferEmail) {
    return {
      ok: true as const,
      status: 201,
      id: lead?.id ?? sheetsLeadId ?? `sheets-${Date.now()}`,
      emailSent: false,
      emailDeferred: true,
      message: SUCCESS_LEAD_MESSAGE,
    };
  }

  const emailSent = lead ? await completeLeadEmailDelivery(lead.id) : false;

  return {
    ok: true as const,
    status: 201,
    id: lead?.id ?? sheetsLeadId ?? `sheets-${Date.now()}`,
    emailSent,
    emailDeferred: false,
    message: SUCCESS_LEAD_MESSAGE,
  };
}
