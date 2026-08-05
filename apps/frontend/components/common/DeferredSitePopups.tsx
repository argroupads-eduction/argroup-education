'use client';

import { useEffect, useState } from 'react';
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
 * Site-wide lead enquiry popup (~4s after each page opens).
 * Mount only after hydration so dialog trees cannot mismatch SSR HTML.
 */
export function DeferredSitePopups() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;

    clearLegacyLeadPopupBlocks();

    if (isLeadPopupSubmitted()) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (isLeadPopupSubmitted() || isLeadPopupOpen()) return;
      openLeadCapturePopup();
    }, LEAD_POPUP_AUTO_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [pathname, mounted]);

  if (!mounted) return null;

  return <LeadCapturePopup />;
}
