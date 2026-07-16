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
