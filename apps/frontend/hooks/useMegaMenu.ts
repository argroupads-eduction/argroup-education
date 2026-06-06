'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type MegaMenuId = 'mbbs-india' | 'mbbs-abroad' | 'md-ms';

const MEGA_CLOSE_DELAY_MS = 90;

function isInsideMegaHoverZone(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('.nav-mega-shell') ||
      target.closest('.nav-mega-trigger') ||
      target.closest('.nav-mega-bridge') ||
      target.closest('.nav-latest-updates-panel') ||
      target.closest('.nav-latest-updates-flyout') ||
      target.closest('.nav-latest-updates-trigger')
  );
}

export function useMegaMenu() {
  const [megaOpen, setMegaOpen] = useState<MegaMenuId | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const forceClose = useCallback(() => {
    clearCloseTimer();
    setMegaOpen(null);
  }, [clearCloseTimer]);

  const openMega = useCallback(
    (id: MegaMenuId) => {
      clearCloseTimer();
      setMegaOpen((current) => (current === id ? current : id));
    },
    [clearCloseTimer]
  );

  const toggleMega = useCallback(
    (id: MegaMenuId) => {
      clearCloseTimer();
      setMegaOpen((current) => (current === id ? null : id));
    },
    [clearCloseTimer]
  );

  /** Close when pointer leaves trigger + dropdown panel. */
  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      setMegaOpen(null);
    }, MEGA_CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const cancelClose = useCallback(() => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  /** @deprecated use scheduleClose — kept for Navbar onMouseLeave */
  const closeMega = scheduleClose;

  useEffect(() => {
    if (!megaOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') forceClose();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!isInsideMegaHoverZone(event.target)) forceClose();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (isInsideMegaHoverZone(event.target)) {
        clearCloseTimer();
        return;
      }
      scheduleClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointermove', onPointerMove);
    };
  }, [megaOpen, forceClose, scheduleClose, clearCloseTimer]);

  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  return {
    megaOpen,
    openMega,
    toggleMega,
    closeMega,
    scheduleClose,
    cancelClose,
    forceClose,
    rootRef,
  };
}
