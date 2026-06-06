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
