import Image from 'next/image';

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

/** Full image visible — never cropped (object-contain). */
export function BlogImage({ src, alt, variant, priority, sizes }: BlogImageProps) {
  return (
    <div className={`blog-image-frame ${variantClass[variant]}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain object-center"
        sizes={sizes}
        unoptimized
        priority={priority}
      />
    </div>
  );
}
