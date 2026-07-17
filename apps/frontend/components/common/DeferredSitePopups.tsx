'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LeadCapturePopup } from '@/components/common/LeadCapturePopup';
import { openLeadCapturePopup } from '@/lib/openLeadCapture';
import {
  clearLegacyLeadPopupBlocks,
  isLeadPopupOpen,
  isLeadPopupSubmitted,
  LEAD_POPUP_AUTO_DELAY_MS,
} from '@/lib/sitePopupCoordination';

/**
 * Site-wide enquiry popup. Opens once, 4s after each page/route change.
 * Closing does not reschedule — only a new navigation starts a fresh 4s timer.
 */
export function DeferredSitePopups() {
  const pathname = usePathname();

  useEffect(() => {
    clearLegacyLeadPopupBlocks();
    if (isLeadPopupSubmitted()) return undefined;

    const timer = window.setTimeout(() => {
      if (isLeadPopupSubmitted() || isLeadPopupOpen()) return;
      openLeadCapturePopup();
    }, LEAD_POPUP_AUTO_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return <LeadCapturePopup />;
}
