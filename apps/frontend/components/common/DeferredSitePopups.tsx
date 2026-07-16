'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { RANK_PREDICTOR_POPUP_DELAY_MS } from '@/lib/rankPredictorPopup';

const LeadCapturePopup = dynamic(
  () =>
    import('@/components/common/LeadCapturePopup').then((m) => ({
      default: m.LeadCapturePopup,
    })),
  { ssr: false }
);

const NeetRankPredictorPopup = dynamic(
  () =>
    import('@/components/neet-rank-predictor/NeetRankPredictorPopup').then((m) => ({
      default: m.NeetRankPredictorPopup,
    })),
  { ssr: false }
);

/**
 * Defer heavy popup JS until idle / first interaction / just before the rank
 * auto-open timer — same UX delays, less main-thread work on first paint.
 */
export function DeferredSitePopups() {
  const [ready, setReady] = useState(false);
  const [rankDelayMs, setRankDelayMs] = useState(RANK_PREDICTOR_POPUP_DELAY_MS);
  const pageStartRef = useRef(0);

  useEffect(() => {
    pageStartRef.current = performance.now();
    let cancelled = false;
    let enabled = false;

    const enable = () => {
      if (cancelled || enabled) return;
      enabled = true;
      const elapsed = performance.now() - pageStartRef.current;
      setRankDelayMs(Math.max(0, RANK_PREDICTOR_POPUP_DELAY_MS - elapsed));
      setReady(true);
    };

    // Mount just before the rank popup would normally open so its timer still lands ~4s.
    const beforeRankMs = Math.max(0, RANK_PREDICTOR_POPUP_DELAY_MS - 800);
    const beforeRankTimer = window.setTimeout(enable, beforeRankMs);

    let idleId: number | undefined;
    let idleFallback: number | undefined;
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(enable, { timeout: 2500 });
    } else {
      idleFallback = window.setTimeout(enable, 1800);
    }

    const onInteract = () => enable();
    window.addEventListener('pointerdown', onInteract, { once: true, passive: true });
    window.addEventListener('keydown', onInteract, { once: true });
    window.addEventListener('scroll', onInteract, { once: true, passive: true });
    window.addEventListener('touchstart', onInteract, { once: true, passive: true });

    return () => {
      cancelled = true;
      window.clearTimeout(beforeRankTimer);
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (idleFallback !== undefined) window.clearTimeout(idleFallback);
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('touchstart', onInteract);
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <NeetRankPredictorPopup openDelayMs={rankDelayMs} />
      <LeadCapturePopup />
    </>
  );
}
