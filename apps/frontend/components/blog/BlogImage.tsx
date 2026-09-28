'use client';

import { useState } from 'react';
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
  const [failed, setFailed] = useState(false);
  const [activeSrc, setActiveSrc] = useState(resolvedSrc);

  if (!activeSrc || failed) {
    return (
      <div className={`blog-image-frame ${variantClass[variant]} blog-image-frame--empty`} aria-hidden>
        <span className="blog-image-frame__empty-label">Blog</span>
      </div>
    );
  }

  const onError = () => {
    if (activeSrc.includes('.webp') && !/[?&]v=2(?:&|$)/.test(activeSrc)) {
      setActiveSrc(activeSrc.includes('?') ? `${activeSrc}&v=2` : `${activeSrc}?v=2`);
      return;
    }
    setFailed(true);
  };

  if (variant === 'hero' || variant === 'featured') {
    return (
      <div className={`blog-image-frame ${variantClass[variant]}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeSrc}
          alt={alt}
          className="blog-image-frame__fit"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          sizes={sizes}
          onError={onError}
        />
      </div>
    );
  }

  return (
    <div className={`blog-image-frame ${variantClass[variant]}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={activeSrc}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain object-center"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        sizes={sizes}
        onError={onError}
      />
    </div>
  );
}
