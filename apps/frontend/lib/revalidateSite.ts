import { revalidatePath } from 'next/cache';

export function revalidateAfterContentSync(opts: {
  slug: string;
  type: 'post' | 'page';
}) {
  revalidatePath('/blog');
  if (opts.type === 'post') {
    revalidatePath(`/blog/${opts.slug}`);
  } else {
    revalidatePath(`/${opts.slug}`);
  }
}
