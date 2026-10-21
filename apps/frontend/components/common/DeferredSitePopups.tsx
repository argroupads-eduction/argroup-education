'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { LEAD_CAPTURE_OPEN_EVENT, openLeadCapturePopup } from '@/lib/openLeadCapture';
import {
  clearLegacyLeadPopupBlocks,
  isLeadPopupOpen,
  LEAD_POPUP_AUTO_DELAY_MS,
  shouldSkipLeadPopupAutoOpen,
} from '@/lib/sitePopupCoordination';

const LeadCapturePopup = dynamic(
  () =>
    import('@/components/common/LeadCapturePopup').then((m) => m.LeadCapturePopup),
  { ssr: false },
);

/**
 * Lead capture popup — mounts after the page is ready, then auto-opens at once
 * so visitors see the enquiry form as soon as the site is open.
 */
export function DeferredSitePopups() {
  const pathname = usePathname() || '/';
  const [ready, setReady] = useState(false);
  const pendingOpen = useRef(false);

  useEffect(() => {
    const arm = () => {
      pendingOpen.current = true;
      setReady(true);
    };
    window.addEventListener(LEAD_CAPTURE_OPEN_EVENT, arm);

    const markReady = () => setReady(true);
    // Page already loaded (client navigation / cached) → show immediately.
    if (document.readyState === 'complete') {
      markReady();
    } else {
      window.addEventListener('load', markReady, { once: true });
      // Fallback if `load` is slow (long assets) — still open soon after paint.
      const fallback = window.setTimeout(markReady, 1200);
      return () => {
        window.removeEventListener(LEAD_CAPTURE_OPEN_EVENT, arm);
        window.removeEventListener('load', markReady);
        window.clearTimeout(fallback);
      };
    }

    return () => {
      window.removeEventListener(LEAD_CAPTURE_OPEN_EVENT, arm);
    };
  }, []);

  useEffect(() => {
    if (!ready || !pendingOpen.current) return;
    pendingOpen.current = false;
    const id = window.requestAnimationFrame(() => openLeadCapturePopup());
    return () => window.cancelAnimationFrame(id);
  }, [ready]);

  useEffect(() => {
    if (!ready) return undefined;

    if (pathname === '/thank-you' || pathname.startsWith('/thank-you')) {
      return undefined;
    }

    clearLegacyLeadPopupBlocks();

    if (shouldSkipLeadPopupAutoOpen()) {
      return undefined;
    }

    const open = () => {
      if (shouldSkipLeadPopupAutoOpen() || isLeadPopupOpen()) return;
      openLeadCapturePopup();
    };

    if (LEAD_POPUP_AUTO_DELAY_MS <= 0) {
      const id = window.requestAnimationFrame(() => open());
      return () => window.cancelAnimationFrame(id);
    }

    const timer = window.setTimeout(open, LEAD_POPUP_AUTO_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, ready]);

  if (!ready) return null;

  return <LeadCapturePopup />;
}
