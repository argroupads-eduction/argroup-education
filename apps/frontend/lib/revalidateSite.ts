import { revalidatePath, revalidateTag } from 'next/cache';
import { BLOG_SLUG_CANONICAL, blogPostPath } from '@/lib/blogUtils';
import { IMAGE_SITEMAP_PATH } from '@/lib/seoCrawlConfig';

function revalidateBlogSlugPaths(slug: string) {
  const paths = new Set<string>([blogPostPath(slug)]);
  const canonical = BLOG_SLUG_CANONICAL[slug];
  if (canonical) paths.add(blogPostPath(canonical));
  for (const [alias, target] of Object.entries(BLOG_SLUG_CANONICAL)) {
    if (target === slug) paths.add(blogPostPath(alias));
  }
  for (const path of paths) revalidatePath(path);
}

export function revalidateAfterContentSync(opts: {
  slug: string;
  type: 'post' | 'page';
}) {
  // Bust unstable_cache used by blog post pages (path revalidate alone is not enough).
  revalidateTag('blog-posts');
  revalidateTag('blog-post');
  revalidateTag('blog-sidebar');
  revalidatePath('/blog');
  revalidatePath('/sitemap.xml');
  revalidatePath('/sitemap');
  revalidatePath(IMAGE_SITEMAP_PATH);
  // App Router sitemap.ts route
  revalidatePath('/sitemap.xml', 'page');
  if (opts.type === 'post') {
    revalidateBlogSlugPaths(opts.slug);
  } else {
    revalidatePath('/');
    revalidatePath(`/${opts.slug.split('/').map(encodeURIComponent).join('/')}`);
  }
}
