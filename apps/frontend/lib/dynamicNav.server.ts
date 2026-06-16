import { getNavPages } from '@backend/handlers/navPages';
import { hasUsableDatabase } from '@/lib/databaseEnv';
import { normalizeNavPages } from '@/lib/dynamicNav';
import type { DynamicNavPage } from '@/lib/dynamicNav';
import { withServerTimeout } from '@/lib/serverTimeout';

const NAV_FETCH_TIMEOUT_MS = 5000;

export async function fetchDynamicNavPages(): Promise<DynamicNavPage[]> {
  if (!hasUsableDatabase()) {
    return [];
  }

  return withServerTimeout(
    getNavPages()
      .then((rows) => normalizeNavPages(rows))
      .catch(() => [] as DynamicNavPage[]),
    NAV_FETCH_TIMEOUT_MS,
    []
  );
}
