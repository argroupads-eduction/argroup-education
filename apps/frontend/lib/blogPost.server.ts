import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getWpPostBySlug, getWpLatestPosts } from '@/lib/wpApi';
import {
  getBlogPostBySlug as loadDbPostBySlug,
  getLatestBlogSidebar as loadDbSidebar,
} from '@backend/handlers/blogs';

// WordPress-first. WordPress mein post na mile (ya WordPress down ho) to purana DB handler.
const cachedPostBySlug = unstable_cache(
  async (slug: string) => {
    const wp = await getWpPostBySlug(slug);
    if (wp) return wp;
    return loadDbPostBySlug(slug);
  },
  ['blog-post-by-slug-v7-wp-first'],
  { revalidate: 60, tags: ['blog-posts', 'blog-post'] }
);

const cachedSidebar = unstable_cache(
  async () => (await getWpLatestPosts(8)) ?? (await loadDbSidebar(8)),
  ['blog-post-sidebar-v6-wp-first'],
  { revalidate: 60, tags: ['blog-posts', 'blog-sidebar'] }
);

/** /blog/[slug]: request-deduped + cached. WordPress pehle, na mile to DB. */
export const getBlogPostPageDataCached = cache(async (slug: string) => {
  const [post, latestPosts] = await Promise.all([
    cachedPostBySlug(slug),
    cachedSidebar(),
  ]);
  return { post, latestPosts };
});