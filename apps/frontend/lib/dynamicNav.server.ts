import { loadMonorepoEnv } from '@backend/lib/loadMonorepoEnv';
import { getNavPages } from '@backend/handlers/navPages';
import { normalizeNavPages } from '@/lib/dynamicNav';
import type { DynamicNavPage } from '@/lib/dynamicNav';

export async function fetchDynamicNavPages(): Promise<DynamicNavPage[]> {
  loadMonorepoEnv();
  if (!process.env.DATABASE_URL?.trim()) {
    return [];
  }

  try {
    const rows = await getNavPages();
    return normalizeNavPages(rows);
  } catch {
    return [];
  }
}
