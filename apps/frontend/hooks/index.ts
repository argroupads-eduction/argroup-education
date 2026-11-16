'use client';

import { useState, useEffect } from 'react';

export { useMegaMenu, type MegaMenuId } from './useMegaMenu';
export { useBodyScrollLock } from './useBodyScrollLock';

export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setScrollPosition(window.scrollY);
        frame = 0;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return scrollPosition;
}
