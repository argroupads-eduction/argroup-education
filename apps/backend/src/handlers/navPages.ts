import { prisma, withPrismaRetry } from '../lib/prisma';

export type NavPageRow = {
  slug: string;
  title: string;
  navSection: string | null;
  navParent: string | null;
  navLabel: string | null;
  navSortOrder: number;
};

export async function getNavPages(): Promise<NavPageRow[]> {
  const rows = await withPrismaRetry(() =>
    prisma.sitePage.findMany({
      where: { published: true, navEnabled: true },
      select: {
        slug: true,
        title: true,
        navSection: true,
        navParent: true,
        navLabel: true,
        navSortOrder: true,
      },
      orderBy: [{ navSortOrder: 'asc' }, { title: 'asc' }],
    })
  );

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    navSection: row.navSection,
    navParent: row.navParent,
    navLabel: row.navLabel,
    navSortOrder: row.navSortOrder,
  }));
}
