import Image from 'next/image';

type FitImageProps = {
  src: string;
  alt: string;
  /** Optional max height for framed layouts (px or css length). */
  maxHeight?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  frameClassName?: string;
};

/** Image always fully visible — container adapts, no cropping. */
export function FitImage({
  src,
  alt,
  maxHeight,
  priority,
  sizes = '100vw',
  className = '',
  frameClassName = '',
}: FitImageProps) {
  return (
    <div
      className={`fit-image-frame ${frameClassName}`.trim()}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={800}
        className={`fit-image-frame__img ${className}`.trim()}
        sizes={sizes}
        unoptimized
        priority={priority}
      />
    </div>
  );
}
