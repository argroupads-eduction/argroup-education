import { revalidatePath } from 'next/cache';
import { BLOG_SLUG_CANONICAL, blogPostPath } from '@/lib/blogUtils';

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
  revalidatePath('/blog');
  if (opts.type === 'post') {
    revalidateBlogSlugPaths(opts.slug);
  } else {
    revalidatePath('/');
    revalidatePath(`/${opts.slug.split('/').map(encodeURIComponent).join('/')}`);
  }
}
