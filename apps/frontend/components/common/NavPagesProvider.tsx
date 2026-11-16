'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { DynamicNavPage } from '@/lib/dynamicNav';

const NavPagesContext = createContext<DynamicNavPage[]>([]);

export function NavPagesProvider({
  pages,
  children,
}: {
  pages: DynamicNavPage[];
  children: ReactNode;
}) {
  return <NavPagesContext.Provider value={pages}>{children}</NavPagesContext.Provider>;
}

export function useDynamicNavPages(): DynamicNavPage[] {
  return useContext(NavPagesContext);
}
