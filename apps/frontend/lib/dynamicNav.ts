export type DynamicNavPage = {
  slug: string;
  title: string;
  label: string;
  href: string;
  section: string;
  parent: string | null;
  sortOrder: number;
};

export function navPageLabel(title: string, navLabel?: string | null): string {
  const custom = navLabel?.trim();
  return custom || title;
}

export function navPageHref(slug: string): string {
  return `/${slug.split('/').filter(Boolean).map(encodeURIComponent).join('/')}`;
}

export function normalizeNavPages(
  rows: Array<{
    slug: string;
    title: string;
    navSection?: string | null;
    navParent?: string | null;
    navLabel?: string | null;
    navSortOrder?: number | null;
  }>
): DynamicNavPage[] {
  return rows
    .filter((row) => row.slug && row.navSection && row.navSection !== 'none')
    .map((row) => ({
      slug: row.slug,
      title: row.title,
      label: navPageLabel(row.title, row.navLabel),
      href: navPageHref(row.slug),
      section: row.navSection ?? 'none',
      parent: row.navParent?.trim() || null,
      sortOrder: row.navSortOrder ?? 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
}

export function navPagesForSection(pages: DynamicNavPage[], section: string): DynamicNavPage[] {
  return pages.filter((p) => p.section === section);
}

/** Match CMS page to mega-menu state/country by name (case-insensitive). */
export function navPagesForParent(
  pages: DynamicNavPage[],
  section: string,
  parentName: string
): DynamicNavPage[] {
  const key = parentName.trim().toLowerCase();
  return pages.filter(
    (p) =>
      p.section === section &&
      (!p.parent || p.parent.toLowerCase() === key || key.includes(p.parent.toLowerCase()))
  );
}

export async function fetchDynamicNavPages(): Promise<DynamicNavPage[]> {
  try {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const res = await fetch(`${base}/api/cms/nav-pages`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: unknown[] };
    if (!Array.isArray(json.data)) return [];
    return normalizeNavPages(json.data as Parameters<typeof normalizeNavPages>[0]);
  } catch {
    return [];
  }
}
