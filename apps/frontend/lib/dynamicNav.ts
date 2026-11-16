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

export type NavParentContext = {
  name: string;
  id?: string;
  href?: string;
};

function normalizeNavParentKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\//, '')
    .replace(/\/+$/, '');
}

/** Match CMS navParent to a mega-menu group (state name, id, or path like mbbs-india/up). */
export function navParentMatches(pageParent: string | null, ctx: NavParentContext): boolean {
  if (!pageParent?.trim()) return true;

  const pp = normalizeNavParentKey(pageParent);
  const name = ctx.name.trim().toLowerCase();
  const id = ctx.id?.trim().toLowerCase();
  const href = ctx.href ? normalizeNavParentKey(ctx.href) : '';

  if (name && pp === name) return true;
  if (id && pp === id) return true;
  if (href && (pp === href || pp.endsWith(href) || href.endsWith(pp))) return true;

  if (id) {
    const pathVariants = [
      id,
      `mbbs-india/${id}`,
      `mbbs-abroad/${id}`,
      `md-ms/${id}`,
    ];
    if (pathVariants.some((v) => pp === v || pp.endsWith(`/${id}`))) return true;
  }

  const pathTail = pp.split('/').filter(Boolean).pop();
  if (id && pathTail === id) return true;
  if (name && (pp.includes(name) || name.includes(pp))) return true;

  return false;
}

export function navPagesForSection(pages: DynamicNavPage[], section: string): DynamicNavPage[] {
  return pages.filter((p) => p.section === section);
}

export function navPagesForParent(
  pages: DynamicNavPage[],
  section: string,
  parent: NavParentContext | string
): DynamicNavPage[] {
  const ctx: NavParentContext = typeof parent === 'string' ? { name: parent } : parent;

  return pages.filter(
    (p) => p.section === section && navParentMatches(p.parent, ctx)
  );
}

