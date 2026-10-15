'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { LEAD_CAPTURE_OPEN_EVENT, openLeadCapturePopup } from '@/lib/openLeadCapture';
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
  const [ready, setReady] = useState(false);
  const pendingOpen = useRef(false);

  useEffect(() => {
    const arm = () => {
      pendingOpen.current = true;
      setReady(true);
    };
    window.addEventListener(LEAD_CAPTURE_OPEN_EVENT, arm);

    let idleId: number | undefined;
    const preload = () => {
      void import('@/components/common/LeadCapturePopup');
    };
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(preload, { timeout: 4000 });
    }
    const mountLater = window.setTimeout(() => setReady(true), 18000);

    return () => {
      window.removeEventListener(LEAD_CAPTURE_OPEN_EVENT, arm);
      window.clearTimeout(mountLater);
      if (idleId != null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
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

    if (isLeadPopupSubmitted()) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (isLeadPopupSubmitted() || isLeadPopupOpen()) return;
      openLeadCapturePopup();
    }, LEAD_POPUP_AUTO_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [pathname, ready]);

  if (!ready) return null;

  return <LeadCapturePopup />;
}
