import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getWpPostBySlug, getWpLatestPosts } from '@/lib/wpApi';
import { blogSlugLookupCandidates, canonicalBlogSlug } from '@/lib/blogUtils';
import {
  getBlogPostBySlug as loadDbPostBySlug,
  getLatestBlogSidebar as loadDbSidebar,
} from '@backend/handlers/blogs';

// WordPress-first. WordPress mein post na mile (ya WordPress down ho) to purana DB handler.
// Renamed public slugs still resolve the original WordPress post.
const cachedPostBySlug = unstable_cache(
  async (slug: string) => {
    const publicSlug = canonicalBlogSlug(slug);
    for (const candidate of blogSlugLookupCandidates(slug)) {
      const wp = await getWpPostBySlug(candidate);
      if (wp) return { ...wp, slug: publicSlug };
    }
    for (const candidate of blogSlugLookupCandidates(slug)) {
      const db = await loadDbPostBySlug(candidate);
      if (db) return { ...db, slug: publicSlug };
    }
    return null;
  },
  ['blog-post-by-slug-v8-legacy-alias'],
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