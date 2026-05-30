import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { getBlogPosts } from '@/lib/contentApi';

export const metadata: Metadata = {
  title: 'Latest Education Blog 2026 | MBBS, BTech & MBA',
  description:
    'Explore AR Group of Education blog for MBBS India & Abroad admission guides, fees, eligibility, and expert career tips for students.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com'}/blog`,
  },
};

export default async function BlogPage() {
  const { data: blogs } = await getBlogPosts(1, 24);

  return (
    <div className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-4xl font-bold text-navy-900 md:text-5xl">
            Latest <span className="text-gold-500">Articles & Tips</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            MBBS India & Abroad admission guides, fees, eligibility, and expert tips
          </p>
        </div>

        {blogs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <p className="mb-4 text-gray-600">
              No posts in database yet. Run export + import from WordPress.
            </p>
            <code className="text-sm text-navy-800">npm run wp:export && npm run wp:import</code>
          </div>
        ) : (
          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <Link key={blog.id} href={`/${blog.slug}`}>
                <div className="h-full cursor-pointer overflow-hidden rounded-lg bg-white shadow-elevation-1 transition-shadow hover:shadow-elevation-3">
                  <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-gold-500 to-navy-500">
                    {blog.featuredImage ? (
                      <Image
                        src={blog.featuredImage}
                        alt={blog.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-5xl">📚</span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase text-gold-500">
                        {blog.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(blog.publishedAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <h2 className="mb-3 text-xl font-bold text-navy-900">{blog.title}</h2>
                    <p className="mb-4 line-clamp-3 text-gray-600">{blog.excerpt}</p>
                    <span className="font-semibold text-gold-500">Read More →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center">
          <Link href="/">
            <Button variant="navy">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
