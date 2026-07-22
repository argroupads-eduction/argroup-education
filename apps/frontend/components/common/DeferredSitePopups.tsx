'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LeadCapturePopup } from '@/components/common/LeadCapturePopup';
import { CollegePredictorPopup } from '@/components/college-predictor/CollegePredictorPopup';
import {
  armCollegeScheduleFromNow,
  clearCollegePredictorPopupDismissed,
  clearCollegeSchedule,
} from '@/lib/collegePredictorPopup';
import { openLeadCapturePopup } from '@/lib/openLeadCapture';
import {
  clearLegacyLeadPopupBlocks,
  isCollegePopupOpen,
  isLeadPopupOpen,
  isLeadPopupSubmitted,
  LEAD_POPUP_AUTO_DELAY_MS,
} from '@/lib/sitePopupCoordination';

/**
 * Site-wide popups (per page / section visit):
 * 1. Lead enquiry — ~4s after each page opens
 * 2. College Predictor — 3 minutes after that lead opens
 */
export function DeferredSitePopups() {
  const pathname = usePathname();

  useEffect(() => {
    clearLegacyLeadPopupBlocks();
    // Fresh page cycle: don't reuse previous page's college timer / dismiss.
    clearCollegePredictorPopupDismissed();
    clearCollegeSchedule();

    if (isLeadPopupSubmitted()) {
      // Lead form already done this session — still run college timer from this page open.
      armCollegeScheduleFromNow();
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (isLeadPopupSubmitted() || isLeadPopupOpen() || isCollegePopupOpen()) return;
      openLeadCapturePopup();
    }, LEAD_POPUP_AUTO_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <LeadCapturePopup />
      <CollegePredictorPopup />
    </>
  );
}
