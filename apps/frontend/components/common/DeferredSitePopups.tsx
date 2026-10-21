'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { LEAD_CAPTURE_OPEN_EVENT, openLeadCapturePopup } from '@/lib/openLeadCapture';
import {
  armLeadPopupAutoOpen,
  clearLegacyLeadPopupBlocks,
  isLeadPopupOpen,
  shouldSkipLeadPopupAutoOpen,
} from '@/lib/sitePopupCoordination';

const LeadCapturePopup = dynamic(
  () =>
    import('@/components/common/LeadCapturePopup').then((m) => m.LeadCapturePopup),
  { ssr: false },
);

/**
 * Enquiry popup mounts as soon as the site is ready, then opens immediately
 * (listener is armed first so the open event is never missed).
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
    if (document.readyState === 'complete') {
      markReady();
    } else {
      window.addEventListener('load', markReady, { once: true });
      // Don't wait forever on slow assets — open soon after first paint.
      const fallback = window.setTimeout(markReady, 800);
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
    armLeadPopupAutoOpen();
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

    // Arm before open so a still-mounting popup picks it up on mount.
    armLeadPopupAutoOpen();

    const open = () => {
      if (shouldSkipLeadPopupAutoOpen() || isLeadPopupOpen()) return;
      openLeadCapturePopup();
    };

    // Small delay lets the dynamic LeadCapturePopup attach its listener.
    const timer = window.setTimeout(open, 350);
    return () => window.clearTimeout(timer);
  }, [pathname, ready]);

  if (!ready) return null;

  return <LeadCapturePopup />;
}
