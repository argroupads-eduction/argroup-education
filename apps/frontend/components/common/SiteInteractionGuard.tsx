'use client';

import { useEffect } from 'react';
import { isDevtoolsShortcut, isSiteProtectionEnabled } from '@/lib/siteProtection';

function blockContextMenu(event: MouseEvent) {
  event.preventDefault();
}

function blockDevtoolsShortcut(event: KeyboardEvent) {
  if (!isDevtoolsShortcut(event)) return;
  event.preventDefault();
  event.stopPropagation();
}

export function SiteInteractionGuard() {
  useEffect(() => {
    if (!isSiteProtectionEnabled()) return;

    document.addEventListener('contextmenu', blockContextMenu, true);
    document.addEventListener('keydown', blockDevtoolsShortcut, true);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu, true);
      document.removeEventListener('keydown', blockDevtoolsShortcut, true);
    };
  }, []);

  return null;
}
