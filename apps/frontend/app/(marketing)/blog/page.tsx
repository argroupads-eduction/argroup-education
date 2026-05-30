import { Metadata } from 'next';
import { getBlogPosts } from '@/lib/contentApi';
import { BlogIndexLayout } from '@/components/blog/BlogIndexLayout';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';

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

export default async function BlogPage() {
  const { data: blogs } = await getBlogPosts(1, 30);

  if (blogs.length === 0) {
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

  return <BlogIndexLayout blogs={blogs} />;
}
