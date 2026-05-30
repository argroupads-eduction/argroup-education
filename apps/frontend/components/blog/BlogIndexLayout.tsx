import Link from 'next/link';
import type { BlogListItem } from '@/lib/contentApi';
import { BlogListingCard } from './BlogListingCard';
import { BlogLatestSidebar } from './BlogLatestSidebar';

type BlogIndexLayoutProps = {
  blogs: BlogListItem[];
};

export function BlogIndexLayout({ blogs }: BlogIndexLayoutProps) {
  const [featured, ...rest] = blogs;

  return (
    <div className="blog-root">
      <header className="blog-index-hero">
        <div className="mx-auto max-w-7xl px-4">
          <nav className="blog-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span>Blog</span>
          </nav>
          <p className="blog-index-hero__eyebrow">Latest updates & guides</p>
          <h1 className="blog-index-hero__title">
            Medical education <span className="text-gold-500">insights</span>
          </h1>
          <p className="blog-index-hero__lead">
            MBBS India & Abroad — admission guides, fees, eligibility, NEET tips, and expert
            counselling advice for students and parents.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:pb-24 md:pt-10">
        <div className="blog-index-grid">
          <div className="blog-index-main">
            {featured ? <BlogListingCard blog={featured} variant="featured" /> : null}
            {rest.length > 0 ? (
              <div className="blog-index-list">
                <h2 className="blog-index-list__heading">More articles</h2>
                {rest.map((blog) => (
                  <BlogListingCard key={blog.id} blog={blog} variant="compact" />
                ))}
              </div>
            ) : null}
          </div>
          <BlogLatestSidebar posts={blogs} title="Latest blogs" />
        </div>
      </div>
    </div>
  );
}
