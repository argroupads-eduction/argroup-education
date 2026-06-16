import { unstable_cache } from 'next/cache';
import { loadMonorepoEnv } from '@backend/lib/loadMonorepoEnv';
import { getAllSiteGlobals } from '@backend/handlers/globalsSync';
import type {
  FooterGlobalData,
  SiteGlobalsBundle,
  SiteSettingsGlobalData,
} from '@/lib/siteGlobals';

const EMPTY_GLOBALS: SiteGlobalsBundle = {
  footer: null,
  'site-settings': null,
};

const loadSiteGlobalsBundle = unstable_cache(
  async (): Promise<SiteGlobalsBundle> => {
    const rows = await getAllSiteGlobals();
    const map = Object.fromEntries(rows.map((r) => [r.slug, r.data]));
    return {
      footer: (map.footer as FooterGlobalData) ?? null,
      'site-settings': (map['site-settings'] as SiteSettingsGlobalData) ?? null,
    };
  },
  ['site-globals-bundle'],
  { revalidate: 300 }
);

/** Footer + site-settings from CMS globals (direct DB — no layout self-fetch). */
export async function fetchSiteGlobalsBundle(): Promise<SiteGlobalsBundle> {
  loadMonorepoEnv();
  if (!process.env.DATABASE_URL?.trim()) {
    return EMPTY_GLOBALS;
  }

  try {
    return await loadSiteGlobalsBundle();
  } catch {
    return EMPTY_GLOBALS;
  }
}
