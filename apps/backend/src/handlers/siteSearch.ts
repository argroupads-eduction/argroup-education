import { prisma, withPrismaRetry } from '../lib/prisma';

export type SearchHit = {
  type: 'post' | 'page';
  slug: string;
  title: string;
  excerpt: string;
  href: string;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function searchSiteContent(query: string, limit = 20): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const take = Math.min(Math.max(limit, 1), 50);

  const [posts, pages] = await withPrismaRetry(() =>
    Promise.all([
      prisma.blogPost.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { excerpt: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { slug: true, title: true, excerpt: true, content: true },
        take,
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.sitePage.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { excerpt: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { slug: true, title: true, excerpt: true, content: true },
        take,
        orderBy: { updatedAt: 'desc' },
      }),
    ])
  );

  const postHits: SearchHit[] = posts.map((p) => ({
    type: 'post',
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt || stripHtml(p.content).slice(0, 200),
    href: `/blog/${p.slug}`,
  }));

  const pageHits: SearchHit[] = pages.map((p) => ({
    type: 'page',
    slug: p.slug,
    title: p.title,
    excerpt: (p.excerpt && stripHtml(p.excerpt)) || stripHtml(p.content).slice(0, 200),
    href: `/${p.slug}`,
  }));

  return [...postHits, ...pageHits].slice(0, take);
}

export type SitemapEntry = {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: number;
};

export async function buildDynamicSitemap(baseUrl: string): Promise<SitemapEntry[]> {
  const base = baseUrl.replace(/\/$/, '');
  const now = new Date().toISOString();

  const staticEntries: SitemapEntry[] = [
    { loc: `${base}/`, lastmod: now, changefreq: 'daily', priority: 1 },
    { loc: `${base}/blog`, lastmod: now, changefreq: 'daily', priority: 0.8 },
    { loc: `${base}/contact`, lastmod: now, changefreq: 'monthly', priority: 0.7 },
  ];

  const [posts, pages] = await withPrismaRetry(() =>
    Promise.all([
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.sitePage.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ])
  );

  const postEntries: SitemapEntry[] = posts.map((p) => ({
    loc: `${base}/blog/${p.slug.split('/').filter(Boolean).map(encodeURIComponent).join('/')}`,
    lastmod: (p.updatedAt ?? p.publishedAt ?? new Date()).toISOString(),
    changefreq: 'weekly',
    priority: 0.7,
  }));

  const pageEntries: SitemapEntry[] = pages.map((p) => ({
    loc: `${base}/${p.slug}`,
    lastmod: (p.updatedAt ?? p.publishedAt ?? new Date()).toISOString(),
    changefreq: 'weekly',
    priority: 0.6,
  }));

  const seen = new Set<string>();
  const merged = [...staticEntries, ...pageEntries, ...postEntries].filter((e) => {
    if (seen.has(e.loc)) return false;
    seen.add(e.loc);
    return true;
  });

  return merged;
}
