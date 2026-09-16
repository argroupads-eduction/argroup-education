'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SiteGlobalsBundle } from '@/lib/siteGlobals';

const SiteGlobalsContext = createContext<SiteGlobalsBundle>({
  footer: null,
  'site-settings': null,
});

export function SiteGlobalsProvider({
  globals,
  children,
}: {
  globals: SiteGlobalsBundle;
  children: ReactNode;
}) {
  return (
    <SiteGlobalsContext.Provider value={globals}>{children}</SiteGlobalsContext.Provider>
  );
}

export function useSiteGlobals(): SiteGlobalsBundle {
  return useContext(SiteGlobalsContext);
}
