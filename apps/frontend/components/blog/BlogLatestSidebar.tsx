'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import type { BlogListItem } from '@/lib/contentApi';
import { BlogImage } from './BlogImage';
import { BlogSearchField } from './BlogSearchField';
import {
  blogCardExcerpt,
  blogPostPath,
  formatBlogDate,
  sortBlogPostsByNewest,
} from '@/lib/blogUtils';
import { blogPostMatchesQuery, normalizeBlogSearchText } from '@/lib/blogSearch';

type BlogLatestSidebarProps = {
  posts: BlogListItem[];
  currentSlug?: string;
  title?: string;
  /** Hide built-in search when page already has a hero search (desktop index). */
  showSearch?: boolean;
  query?: string;
  onQueryChange?: (value: string) => void;
};

/** Shared “Latest blogs” widget — same newest list on /blog and every post page. */
export function BlogLatestSidebar({
  posts,
  currentSlug,
  title = 'Latest blogs',
  showSearch = true,
  query: controlledQuery,
  onQueryChange,
}: BlogLatestSidebarProps) {
  const [internalQuery, setInternalQuery] = useState('');
  const query = controlledQuery ?? internalQuery;
  const setQuery = onQueryChange ?? setInternalQuery;
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeBlogSearchText(deferredQuery);

  const catalog = useMemo(
    () => sortBlogPostsByNewest(posts).filter((p) => p.slug !== currentSlug),
    [posts, currentSlug]
  );

  const items = useMemo(() => {
    if (!normalizedQuery) return catalog.slice(0, 8);
    return catalog.filter((post) => blogPostMatchesQuery(post, normalizedQuery)).slice(0, 12);
  }, [catalog, normalizedQuery]);

  const isSearching = normalizedQuery.length > 0;

  if (!catalog.length) return null;

  return (
    <aside className="blog-sidebar" aria-label={title}>
      <div className="blog-sidebar__panel">
        <div className="blog-sidebar__head">
          <h2 className="blog-sidebar__title">{title}</h2>
        </div>

        {showSearch ? (
          <BlogSearchField
            value={query}
            onChange={setQuery}
            variant="sidebar"
            placeholder="Search Blog title or keyword"
            resultCount={isSearching ? items.length : null}
            className="blog-sidebar__search"
          />
        ) : null}

        {items.length ? (
          <ul className="blog-sidebar__list">
            {items.map((post, index) => (
              <li key={post.slug || post.id || `latest-${index}`}>
                <Link href={blogPostPath(post.slug)} className="blog-sidebar__item">
                  <span className="blog-sidebar__index" aria-hidden>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="blog-sidebar__thumb">
                    {post.featuredImage ? (
                      <BlogImage
                        src={post.featuredImage}
                        alt=""
                        variant="thumb"
                        sizes="80px"
                      />
                    ) : (
                      <span className="blog-sidebar__thumb-fallback" aria-hidden />
                    )}
                  </span>
                  <span className="blog-sidebar__meta">
                    <span className="blog-sidebar__item-title">{post.title}</span>
                    <span className="blog-sidebar__date">{formatBlogDate(post.publishedAt)}</span>
                    <span className="blog-sidebar__excerpt line-clamp-2">
                      {blogCardExcerpt(post.excerpt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="blog-sidebar__empty">
            <p>Try another title, slug, or a few letters from the post name.</p>
          </div>
        )}

        <Link href="/blog" className="blog-sidebar__all">
          View all articles →
        </Link>
      </div>
    </aside>
  );
}
