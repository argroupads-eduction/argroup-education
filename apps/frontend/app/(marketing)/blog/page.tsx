import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getBlogPosts } from '@/lib/contentApi';
import { BlogIndexLayout } from '@/components/blog/BlogIndexLayout';

const POSTS_PER_PAGE = 12;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';

/** ISR + on-demand revalidate after Payload sync */
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Latest Education Blog 2026 | MBBS, NEET & Study Abroad',
  description:
    'Explore AR Group of Education blog for MBBS India & Abroad admission guides, fees, eligibility, NEET tips, and expert career advice for students.',
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: 'Medical Education Blog | AR Group of Education',
    description:
      'MBBS India & Abroad guides, fees, eligibility, and expert admission tips.',
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
  const { data: blogs, total, pages } = await getBlogPosts(currentPage, POSTS_PER_PAGE);

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
      currentPage={currentPage}
      totalPages={pages}
      totalPosts={total}
      postsPerPage={POSTS_PER_PAGE}
    />
  );
}
