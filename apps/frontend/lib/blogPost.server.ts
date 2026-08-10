import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import {
  getBlogPostBySlug as loadPostBySlug,
  getLatestBlogSidebar as loadSidebar,
} from '@backend/handlers/blogs';

const cachedPostBySlug = unstable_cache(
  async (slug: string) => loadPostBySlug(slug),
  ['blog-post-by-slug-v1'],
  { revalidate: 60 }
);

const cachedSidebar = unstable_cache(
  async () => loadSidebar(8),
  ['blog-post-sidebar-v1'],
  { revalidate: 60 }
);

/** Request-deduped + ISR-cached Neon load for /blog/[slug]. */
export const getBlogPostPageDataCached = cache(async (slug: string) => {
  const [post, latestPosts] = await Promise.all([
    cachedPostBySlug(slug),
    cachedSidebar(),
  ]);
  return { post, latestPosts };
});
