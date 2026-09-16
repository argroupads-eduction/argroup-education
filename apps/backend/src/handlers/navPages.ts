import { prisma, withPrismaRetry } from '../lib/prisma';

export type NavPageRow = {
  slug: string;
  title: string;
  navSection: string | null;
  navParent: string | null;
  navLabel: string | null;
  navSortOrder: number;
};

function isStaleNavClientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('Unknown argument') ||
    msg.includes('navEnabled') ||
    msg.includes('navSection')
  );
}

/** Raw SQL when Prisma client was not regenerated after nav migration (common in local dev). */
async function getNavPagesRaw(): Promise<NavPageRow[]> {
  return withPrismaRetry(() =>
    prisma.$queryRaw<NavPageRow[]>`
      SELECT
        slug,
        title,
        "navSection" AS "navSection",
        "navParent" AS "navParent",
        "navLabel" AS "navLabel",
        "navSortOrder" AS "navSortOrder"
      FROM "SitePage"
      WHERE published = true AND "navEnabled" = true
      ORDER BY "navSortOrder" ASC, title ASC
    `
  );
}

export async function getNavPages(): Promise<NavPageRow[]> {
  try {
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
  } catch (err) {
    if (!isStaleNavClientError(err)) throw err;

    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[nav-pages] Stale Prisma client — using SQL fallback. Run: npm run db:generate --workspace=ar-education-backend'
      );
    }

    return getNavPagesRaw();
  }
}
