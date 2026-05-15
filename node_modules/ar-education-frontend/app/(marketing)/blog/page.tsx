import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Blog - Medical Education Tips & Guides',
  description: 'Read latest articles about MBBS abroad, medical education, and study tips.',
};

export default function BlogPage() {
  // Mock blog posts - would come from backend in production
  const blogs = [
    {
      id: 1,
      slug: 'top-reasons-study-mbbs-abroad',
      title: 'Top 5 Reasons to Study MBBS Abroad',
      excerpt: 'Explore the key benefits of pursuing your medical degree in international universities...',
      category: 'Education',
      date: new Date('2024-01-15'),
      image: '🌍',
    },
    {
      id: 2,
      slug: 'mbbs-russia-complete-guide',
      title: 'Complete Guide to MBBS in Russia',
      excerpt: 'Everything you need to know about medical education in Russia...',
      category: 'Countries',
      date: new Date('2024-01-10'),
      image: '🇷🇺',
    },
    {
      id: 3,
      slug: 'neet-preparation-tips',
      title: 'NEET Preparation Tips & Strategies',
      excerpt: 'Effective strategies to prepare for NEET exam...',
      category: 'Tips',
      date: new Date('2024-01-05'),
      image: '📚',
    },
  ];

  return (
    <div className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
            Latest <span className="text-gold-500">Articles & Tips</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stay informed with our expert insights on medical education
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {blogs.map((blog) => (
            <Link key={blog.id} href={`/blog/${blog.slug}`}>
              <div className="rounded-lg overflow-hidden shadow-elevation-1 hover:shadow-elevation-3 transition-shadow h-full bg-white cursor-pointer">
                {/* Image */}
                <div className="h-48 bg-gradient-to-br from-gold-500 to-navy-500 flex items-center justify-center text-6xl">
                  {blog.image}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gold-500 uppercase">
                      {blog.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {blog.date.toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-navy-900 mb-3">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{blog.excerpt}</p>
                  <span className="text-gold-500 font-semibold">Read More →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/">
            <Button variant="navy">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
