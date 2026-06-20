import { after } from 'next/server';
import { completeLeadEmailDelivery } from '@backend/handlers/websiteLead';

/** Queue lead email after the HTTP response (handles 20–50 concurrent submits without timeout). */
export function scheduleLeadEmailDelivery(leadId: string): void {
  after(async () => {
    try {
      await completeLeadEmailDelivery(leadId);
    } catch (err) {
      console.error('[scheduleLeadEmailDelivery]', leadId, err);
    }
  });
}

type LeadSubmitResult = {
  id: string;
  emailSent?: boolean;
  emailDeferred?: boolean;
  emailOnly?: boolean;
};

/** Schedule deferred email only when lead was saved to DB (not email-only fallback). */
export function deliverLeadEmailAfterSubmit(result: LeadSubmitResult): void {
  if (result.emailOnly || result.emailSent) return;
  if (result.emailDeferred) scheduleLeadEmailDelivery(result.id);
}
