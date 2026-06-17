import { resolveWpMediaUrl } from '@/lib/wpMediaUrl';

type BlogImageProps = {
  src: string;
  alt: string;
  variant: 'featured' | 'compact' | 'thumb' | 'hero';
  priority?: boolean;
  sizes?: string;
};

const variantClass: Record<BlogImageProps['variant'], string> = {
  featured: 'blog-image-frame--featured',
  compact: 'blog-image-frame--compact',
  thumb: 'blog-image-frame--thumb',
  hero: 'blog-image-frame--hero',
};

/** Full image visible, never cropped (object-contain). Native img avoids Next/Image remote restrictions. */
export function BlogImage({ src, alt, variant, priority, sizes }: BlogImageProps) {
  const resolvedSrc = resolveWpMediaUrl(src) ?? src;

  return (
    <div className={`blog-image-frame ${variantClass[variant]}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain object-center"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        sizes={sizes}
      />
    </div>
  );
}
