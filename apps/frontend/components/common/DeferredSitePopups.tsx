'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { openLeadCapturePopup } from '@/lib/openLeadCapture';
import {
  clearLegacyLeadPopupBlocks,
  isLeadPopupOpen,
  isLeadPopupSubmitted,
  LEAD_POPUP_AUTO_DELAY_MS,
} from '@/lib/sitePopupCoordination';

const LeadCapturePopup = dynamic(
  () =>
    import('@/components/common/LeadCapturePopup').then((m) => m.LeadCapturePopup),
  { ssr: false },
);

/**
 * Deferred lead capture popup (auto-open after delay).
 * Heavy form/dialog code loads only after mount — keeps homepage INP cleaner.
 */
export function DeferredSitePopups() {
  const pathname = usePathname() || '/';
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
