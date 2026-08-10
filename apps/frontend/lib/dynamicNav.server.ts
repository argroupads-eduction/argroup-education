import { unstable_cache } from 'next/cache';
import { getNavPages } from '@backend/handlers/navPages';
import { hasUsableDatabase } from '@/lib/databaseEnv';
import { normalizeNavPages } from '@/lib/dynamicNav';
import type { DynamicNavPage } from '@/lib/dynamicNav';
import { withServerTimeout } from '@/lib/serverTimeout';

const NAV_FETCH_TIMEOUT_MS = 5000;

const loadDynamicNavPages = unstable_cache(
  async (): Promise<DynamicNavPage[]> => {
    try {
      const rows = await getNavPages();
      return normalizeNavPages(rows);
    } catch {
      return [];
    }
  },
  ['dynamic-nav-pages-v1'],
  { revalidate: 300 }
);

/** Cached nav CMS pages — must not block every navigation on a cold Prisma round-trip. */
export async function fetchDynamicNavPages(): Promise<DynamicNavPage[]> {
  if (!hasUsableDatabase()) {
    return [];
  }

  return withServerTimeout(loadDynamicNavPages(), NAV_FETCH_TIMEOUT_MS, []);
}
