import { unstable_cache } from 'next/cache';
import { loadMonorepoEnv } from '@backend/lib/loadMonorepoEnv';
import { getAllSiteGlobals } from '@backend/handlers/globalsSync';
import { hasUsableDatabase } from '@/lib/databaseEnv';
import { withServerTimeout } from '@/lib/serverTimeout';
import type {
  FooterGlobalData,
  SiteGlobalsBundle,
  SiteSettingsGlobalData,
} from '@/lib/siteGlobals';

const GLOBALS_FETCH_TIMEOUT_MS = 5000;

export const EMPTY_SITE_GLOBALS: SiteGlobalsBundle = {
  footer: null,
  'site-settings': null,
};

const loadSiteGlobalsBundle = unstable_cache(
  async (): Promise<SiteGlobalsBundle> => {
    try {
      const rows = await getAllSiteGlobals();
      const map = Object.fromEntries(rows.map((r) => [r.slug, r.data]));
      return {
        footer: (map.footer as FooterGlobalData) ?? null,
        'site-settings': (map['site-settings'] as SiteSettingsGlobalData) ?? null,
      };
    } catch {
      return EMPTY_SITE_GLOBALS;
    }
  },
  ['site-globals-bundle'],
  { revalidate: 300 }
);

/** Footer + site-settings from CMS globals (direct DB — no layout self-fetch). */
export async function fetchSiteGlobalsBundle(): Promise<SiteGlobalsBundle> {
  loadMonorepoEnv();
  if (!hasUsableDatabase()) {
    return EMPTY_SITE_GLOBALS;
  }

  return withServerTimeout(
    loadSiteGlobalsBundle(),
    GLOBALS_FETCH_TIMEOUT_MS,
    EMPTY_SITE_GLOBALS
  );
}
