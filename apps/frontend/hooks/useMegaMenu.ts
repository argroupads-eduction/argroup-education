'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type MegaMenuId = 'mbbs-india' | 'mbbs-abroad' | 'md-ms';

const CLOSE_MS = 280;

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

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setMegaOpen(null);
      closeTimer.current = null;
    }, CLOSE_MS);
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
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(event.target as Node)) forceClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [megaOpen, forceClose]);

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
