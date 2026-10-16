import Image from 'next/image';
import { resolveWpMediaUrl } from '@/lib/wpMediaUrl';

type FitImageProps = {
  src: string;
  alt: string;
  /** Optional max height for framed layouts (px or css length). */
  maxHeight?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  frameClassName?: string;
  /** `cover` fills the frame (hub banners); default `contain` never crops. */
  fit?: 'contain' | 'cover';
  onError?: () => void;
};

/** Image framing helper — contain by default; cover for full-bleed banners. */
export function FitImage({
  src,
  alt,
  maxHeight,
  priority,
  sizes = '100vw',
  className = '',
  frameClassName = '',
  fit = 'contain',
  onError,
}: FitImageProps) {
  const resolvedSrc = resolveWpMediaUrl(src) ?? src;
  const isCover = fit === 'cover';
  const isRemote = /^https?:\/\//i.test(resolvedSrc);

  if (isRemote) {
    return (
      <div
        className={`fit-image-frame ${isCover ? 'fit-image-frame--cover' : ''} ${frameClassName}`.trim()}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {/* CMS uploads stay on cms.argroupofeducation.com — a plain img avoids the image optimizer allow-list. */}
        <img
          src={resolvedSrc}
          alt={alt}
          className={`fit-image-frame__img ${isCover ? 'fit-image-frame__img--cover' : ''} ${className}`.trim()}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onError={onError}
        />
      </div>
    );
  }

  return (
    <div
      className={`fit-image-frame ${isCover ? 'fit-image-frame--cover' : ''} ${frameClassName}`.trim()}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <Image
        src={resolvedSrc}
        alt={alt}
        width={1200}
        height={800}
        className={`fit-image-frame__img ${isCover ? 'fit-image-frame__img--cover' : ''} ${className}`.trim()}
        sizes={sizes}
        unoptimized
        priority={priority}
        onError={onError}
      />
    </div>
  );
}
