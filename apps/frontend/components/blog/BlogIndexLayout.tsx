'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BlogListItem } from '@/lib/contentApi';
import { blogPostPath, sortBlogPostsByNewest } from '@/lib/blogUtils';
import { blogPostMatchesQuery, normalizeBlogSearchText } from '@/lib/blogSearch';
import { BlogListingCard } from './BlogListingCard';
import { BlogLatestSidebar } from './BlogLatestSidebar';
import { BlogPagination } from './BlogPagination';
import { BlogSearchField } from './BlogSearchField';

type BlogIndexLayoutProps = {
  blogs: BlogListItem[];
  /** Full catalog for search + newest sidebar list. */
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
  const router = useRouter();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeBlogSearchText(deferredQuery);
  const isSearching = normalizedQuery.length > 0;

  const pageSorted = useMemo(() => sortBlogPostsByNewest(blogs), [blogs]);
  const catalog = useMemo(
    () => sortBlogPostsByNewest(latestPosts ?? blogs),
    [latestPosts, blogs]
  );

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return catalog.filter((post) => blogPostMatchesQuery(post, normalizedQuery));
  }, [catalog, isSearching, normalizedQuery]);

  const showFeatured = !isSearching && currentPage === 1;
  const featured = showFeatured ? pageSorted[0] : null;
  const rest = showFeatured ? pageSorted.slice(1) : pageSorted;

  // Prefetch first page of posts on mount — mobile has no hover warmup.
  useEffect(() => {
    const targets = [featured, ...rest].filter(Boolean).slice(0, 10) as BlogListItem[];
    for (const post of targets) {
      if (!post.slug) continue;
      try {
        router.prefetch(blogPostPath(post.slug));
      } catch {
        /* ignore */
      }
    }
  }, [featured, rest, router]);

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

      <div className="blog-index-search-sticky" role="search">
        <div className="blog-index-search-sticky__inner">
          <BlogSearchField
            value={query}
            onChange={setQuery}
            variant="hero"
            resultCount={isSearching ? searchResults.length : null}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:pb-24 md:pt-8">
        <div className="blog-index-grid">
          <div className="blog-index-main">
            {isSearching ? (
              <div className="blog-index-list">
                <h2 className="blog-index-list__heading">Search results</h2>
                {searchResults.length > 0 ? (
                  searchResults.map((blog) => (
                    <BlogListingCard key={blog.slug || blog.id} blog={blog} variant="compact" />
                  ))
                ) : (
                  <div className="blog-search-empty">
                    <p>No blogs matched your search. Try a shorter title, URL, or keyword.</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {featured ? <BlogListingCard blog={featured} variant="featured" /> : null}
                {rest.length > 0 ? (
                  <div className="blog-index-list">
                    <h2 className="blog-index-list__heading">
                      {currentPage === 1 ? 'More articles' : `Articles · Page ${currentPage}`}
                    </h2>
                    {rest.map((blog) => (
                      <BlogListingCard key={blog.slug || blog.id} blog={blog} variant="compact" />
                    ))}
                  </div>
                ) : null}

                <BlogPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalPosts={totalPosts}
                  perPage={postsPerPage}
                />
              </>
            )}
          </div>

          <BlogLatestSidebar
            posts={catalog}
            title="Latest blogs"
            showSearch={false}
            query={query}
            onQueryChange={setQuery}
          />
        </div>
      </div>
    </div>
  );
}
