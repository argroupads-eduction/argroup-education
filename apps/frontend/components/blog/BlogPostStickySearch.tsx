'use client';

import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import type { BlogListItem } from '@/lib/contentApi';
import { blogPostMatchesQuery, normalizeBlogSearchText } from '@/lib/blogSearch';
import { BlogLatestSidebar } from './BlogLatestSidebar';
import { BlogSearchField } from './BlogSearchField';

type BlogPostStickySearchProps = {
  posts: BlogListItem[];
  currentSlug: string;
  toc?: ReactNode;
  counselling?: ReactNode;
  children: ReactNode;
};

/** Sticky search + synced Latest blogs sidebar for single post pages. */
export function BlogPostStickySearch({
  posts,
  currentSlug,
  toc,
  counselling,
  children,
}: BlogPostStickySearchProps) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeBlogSearchText(deferredQuery);
  const isSearching = normalizedQuery.length > 0;

  const matchCount = useMemo(() => {
    if (!isSearching) return null;
    return posts.filter(
      (post) => post.slug !== currentSlug && blogPostMatchesQuery(post, normalizedQuery)
    ).length;
  }, [posts, currentSlug, isSearching, normalizedQuery]);

  return (
    <>
      <div className="blog-index-search-sticky blog-post-search-sticky" role="search">
        <div className="blog-index-search-sticky__inner">
          <BlogSearchField
            value={query}
            onChange={setQuery}
            variant="hero"
            resultCount={matchCount}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:pb-24 md:pt-8">
        <div className="blog-post-grid">
          {children}
          <div className="blog-post-aside space-y-5 lg:sticky lg:top-[7.5rem] lg:self-start">
            {toc}
            <BlogLatestSidebar
              posts={posts}
              currentSlug={currentSlug}
              title="Latest blogs"
              showSearch={false}
              query={query}
              onQueryChange={setQuery}
            />
            {counselling}
          </div>
        </div>
      </div>
    </>
  );
}
