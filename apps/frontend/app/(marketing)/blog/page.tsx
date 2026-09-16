import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getBlogIndexListing } from '@backend/handlers/blogs';
import { BlogIndexLayout } from '@/components/blog/BlogIndexLayout';
import { BLOG_EXCLUDED_LIST_SLUGS, dedupeBlogPosts, sortBlogPostsByNewest } from '@/lib/blogUtils';

const POSTS_PER_PAGE = 12;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';

/**
 * Short ISR window so article counts refresh quickly after Payload publish/delete.
 * On-demand /api/revalidate still busts cache immediately after CMS sync.
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
  const excludeSlugs = [...BLOG_EXCLUDED_LIST_SLUGS];

  let blogs: Awaited<ReturnType<typeof getBlogIndexListing>>['blogs'] = [];
  let catalog: Awaited<ReturnType<typeof getBlogIndexListing>>['catalog'] = [];
  let total = 0;
  let pages = 1;

  try {
    const listing = await getBlogIndexListing({
      page: currentPage,
      pageSize: POSTS_PER_PAGE,
      catalogSize: 500,
      excludeSlugs,
    });
    blogs = listing.blogs;
    catalog = listing.catalog;
    total = listing.total;
    pages = listing.pages;
  } catch {
    blogs = [];
    catalog = [];
  }

  const uniqueCatalog = sortBlogPostsByNewest(dedupeBlogPosts(catalog));
  const uniqueBlogs = sortBlogPostsByNewest(dedupeBlogPosts(blogs));

  if (currentPage > 1 && uniqueBlogs.length === 0) {
    redirect('/blog');
  }

  if (uniqueBlogs.length === 0 && currentPage === 1) {
    return (
      <div className="blog-root mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold text-navy-900">Blog</h1>
        <p className="mt-4 text-slate-600">
          Blog database is reconnecting. Set Amplify DATABASE_URL to Hostinger MySQL and redeploy.
        </p>
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
