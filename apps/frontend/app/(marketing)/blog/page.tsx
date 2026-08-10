import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getBlogIndexListing } from '@backend/handlers/blogs';
import { BlogIndexLayout } from '@/components/blog/BlogIndexLayout';

const POSTS_PER_PAGE = 12;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';

/**
 * Cached shell so /blog opens fast. CMS sync still runs in the background via
 * getBlogIndexListing — it must never block first paint.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Education News And Updates | Medical Admission Blogs',
  description:
    'Stay informed with the latest education news and updates. Read our medical admission blogs for expert insights into NEET counseling, cutoffs, and college guides.',
  keywords: ['Education News And Updates', 'Medical Admission Blogs'],
  icons: {
    icon: [{ url: '/ar-browser-icon.png', type: 'image/png' }],
    shortcut: ['/ar-browser-icon.png'],
    apple: [{ url: '/ar-browser-icon.png', type: 'image/png' }],
  },
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

  const { blogs, catalog, total, pages } = await getBlogIndexListing({
    page: currentPage,
    pageSize: POSTS_PER_PAGE,
    catalogSize: 200,
  });

  if (currentPage > 1 && blogs.length === 0) {
    redirect('/blog');
  }

  if (blogs.length === 0 && currentPage === 1) {
    return (
      <div className="blog-root mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold text-navy-900">Blog</h1>
        <p className="mt-4 text-slate-600">
          No posts yet. Run WordPress export and import, or check the content bundle.
        </p>
        <code className="mt-4 block text-sm text-navy-800">
          npm run wp:export && npm run wp:import
        </code>
      </div>
    );
  }

  return (
    <BlogIndexLayout
      blogs={blogs}
      latestPosts={catalog}
      currentPage={currentPage}
      totalPages={pages}
      totalPosts={total}
      postsPerPage={POSTS_PER_PAGE}
    />
  );
}
