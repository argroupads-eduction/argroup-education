import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getBlogIndexListing } from '@backend/handlers/blogs';
import { BlogIndexLayout } from '@/components/blog/BlogIndexLayout';
import { BLOG_EXCLUDED_LIST_SLUGS, dedupeBlogPosts, sortBlogPostsByNewest } from '@/lib/blogUtils';
import { getWpBlogCatalog } from '@/lib/wpApi';
import { resolveBlogFeaturedImage } from '@/lib/blogFeaturedImages';

const POSTS_PER_PAGE = 12;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';

/**
 * Short ISR window so the post list refreshes quickly after a WordPress publish/delete.
 * On-demand /api/revalidate busts the cache immediately.
 */
export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Education News And Updates | Medical Admission Blogs',
  description:
    'Stay informed with the latest education news and updates. Read our medical admission blogs for expert insights into NEET counseling, cutoffs, and college guides.',
  keywords: ['Education News And Updates', 'Medical Admission Blogs'],
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: 'Education News And Updates | Medical Admission Blogs',
    description:
      'Stay informed with the latest education news and updates. Read our medical admission blogs for expert insights into NEET counseling, cutoffs, and college guides.',
    url: `${SITE_URL}/blog`,
    type: 'website',
  },
};

type BlogPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const excluded = new Set<string>([...BLOG_EXCLUDED_LIST_SLUGS]);

  // WordPress + purana DB dono. WordPress ki post ko priority.
  const [wpRaw, dbListing] = await Promise.all([
    getWpBlogCatalog(500),
    getBlogIndexListing({
      page: 1,
      pageSize: POSTS_PER_PAGE,
      catalogSize: 500,
      excludeSlugs: [...excluded],
    }).catch(() => null),
  ]);

  if (!wpRaw && !dbListing) {
    // Throwing keeps the last good cached page instead of caching an empty list.
    throw new Error('Blog list unavailable (WordPress and DB both failed)');
  }

  type ListItem = NonNullable<typeof wpRaw>[number];
  const bySlug = new Map<string, ListItem>();
  for (const p of dbListing?.catalog ?? []) bySlug.set(p.slug, p as ListItem);
  for (const p of wpRaw ?? []) {
    bySlug.set(p.slug, { ...p, featuredImage: resolveBlogFeaturedImage(p.slug, p.featuredImage) });
  }

  const merged = Array.from(bySlug.values()).filter((p) => !excluded.has(p.slug));
  const uniqueCatalog = sortBlogPostsByNewest(dedupeBlogPosts(merged));
  const total = uniqueCatalog.length;
  const pages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const uniqueBlogs = uniqueCatalog.slice(start, start + POSTS_PER_PAGE);

  if (currentPage > 1 && uniqueBlogs.length === 0) {
    redirect('/blog');
  }

  if (uniqueBlogs.length === 0 && currentPage === 1) {
    return (
      <div className="blog-root mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold text-navy-900">Blog</h1>
        <p className="mt-4 text-slate-600">No posts yet. Publish a post in WordPress and it will appear here.</p>
      </div>
    );
  }

  return (
    <BlogIndexLayout
      blogs={uniqueBlogs}
      latestPosts={uniqueCatalog}
      currentPage={currentPage}
      totalPages={pages}
      totalPosts={total}
      postsPerPage={POSTS_PER_PAGE}
    />
  );
}