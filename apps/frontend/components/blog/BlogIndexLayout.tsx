import Link from 'next/link';
import type { BlogListItem } from '@/lib/contentApi';
import { sortBlogPostsByNewest } from '@/lib/blogUtils';
import { BlogListingCard } from './BlogListingCard';
import { BlogLatestSidebar } from './BlogLatestSidebar';
import { BlogPagination } from './BlogPagination';

type BlogIndexLayoutProps = {
  blogs: BlogListItem[];
  /** Always the newest posts for the shared sidebar (not the current page slice). */
  latestPosts?: BlogListItem[];
  currentPage?: number;
  totalPages?: number;
  totalPosts?: number;
  postsPerPage?: number;
};

export function BlogIndexLayout({
  blogs,
  latestPosts,
  currentPage = 1,
  totalPages = 1,
  totalPosts = 0,
  postsPerPage = 12,
}: BlogIndexLayoutProps) {
  const sorted = sortBlogPostsByNewest(blogs);
  const sidebarPosts = sortBlogPostsByNewest(latestPosts ?? blogs);
  const showFeatured = currentPage === 1;
  const featured = showFeatured ? sorted[0] : null;
  const rest = showFeatured ? sorted.slice(1) : sorted;

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
            Medical education <span className="text-gold-500"> insights</span>
          </h1>
          <p className="blog-index-hero__lead">
            MBBS India & Abroad, admission guides, fees, eligibility, NEET tips, and expert
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
                <h2 className="blog-index-list__heading">
                  {currentPage === 1 ? 'More articles' : `Articles · Page ${currentPage}`}
                </h2>
                {rest.map((blog) => (
                  <BlogListingCard key={blog.id} blog={blog} variant="compact" />
                ))}
              </div>
            ) : null}

            <BlogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalPosts={totalPosts}
              perPage={postsPerPage}
            />
          </div>
          <BlogLatestSidebar posts={sidebarPosts} title="Latest blogs" />
        </div>
      </div>
    </div>
  );
}
