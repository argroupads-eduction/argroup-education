import { revalidatePath } from 'next/cache';
import { blogPostPath } from '@/lib/blogUtils';

export function revalidateAfterContentSync(opts: {
  slug: string;
  type: 'post' | 'page';
}) {
  revalidatePath('/blog');
  if (opts.type === 'post') {
    revalidatePath(blogPostPath(opts.slug));
  } else {
    revalidatePath('/');
    revalidatePath(`/${opts.slug.split('/').map(encodeURIComponent).join('/')}`);
  }
}
