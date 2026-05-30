'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type MegaMenuId = 'mbbs-india' | 'mbbs-abroad' | 'md-ms';

const OPEN_MS = 0;
const CLOSE_MS = 220;

export function useMegaMenu() {
  const [megaOpen, setMegaOpen] = useState<MegaMenuId | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  const openMega = useCallback(
    (id: MegaMenuId) => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      if (openTimer.current) clearTimeout(openTimer.current);
      if (megaOpen === id) return;

      if (OPEN_MS <= 0) {
        setMegaOpen(id);
        return;
      }

      openTimer.current = setTimeout(() => {
        setMegaOpen(id);
        openTimer.current = null;
      }, OPEN_MS);
    },
    [megaOpen]
  );

  const closeMega = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setMegaOpen(null);
      closeTimer.current = null;
    }, CLOSE_MS);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const forceClose = useCallback(() => {
    clearTimers();
    setMegaOpen(null);
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  return { megaOpen, openMega, closeMega, cancelClose, forceClose };
}
