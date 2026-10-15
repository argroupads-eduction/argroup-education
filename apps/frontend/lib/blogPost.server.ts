import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getWpPostBySlug, getWpLatestPosts } from '@/lib/wpApi';

// Sirf WordPress (headless). Database fallback hata diya gaya hai.
const cachedPostBySlug = unstable_cache(
  async (slug: string) => getWpPostBySlug(slug),
  ['blog-post-by-slug-v6-wp-only'],
  { revalidate: 60, tags: ['blog-posts', 'blog-post'] }
);

const cachedSidebar = unstable_cache(
  async () => (await getWpLatestPosts(8)) ?? [],
  ['blog-post-sidebar-v5-wp-only'],
  { revalidate: 60, tags: ['blog-posts', 'blog-sidebar'] }
);

/** /blog/[slug]: request-deduped + cached, data sirf WordPress se. */
export const getBlogPostPageDataCached = cache(async (slug: string) => {
  const [post, latestPosts] = await Promise.all([
    cachedPostBySlug(slug),
    cachedSidebar(),
  ]);
  return { post, latestPosts };
});
// test