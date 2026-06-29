import { getSiteUrl } from '@/lib/siteUrl';
import { toAbsoluteMediaUrl } from '@/lib/toAbsoluteMediaUrl';

export type ImageObjectInput = {
  url: string;
  name?: string;
  caption?: string;
  width?: number;
  height?: number;
  representativeOfPage?: boolean;
};

const PUBLISHER = {
  '@type': 'Organization' as const,
  name: 'AR Group of Education',
  url: getSiteUrl(),
};

/** Schema.org ImageObject for JSON-LD (no visible UI impact). */
export function buildImageObjectSchema(input: ImageObjectInput): Record<string, unknown> {
  const absolute = toAbsoluteMediaUrl(input.url);
  if (!absolute) return {};

  const image: Record<string, unknown> = {
    '@type': 'ImageObject',
    url: absolute,
    contentUrl: absolute,
    publisher: PUBLISHER,
  };

  if (input.name?.trim()) image.name = input.name.trim();
  if (input.caption?.trim()) image.caption = input.caption.trim();
  if (input.width) image.width = input.width;
  if (input.height) image.height = input.height;
  if (input.representativeOfPage) image.representativeOfPage = true;

  return image;
}

export function buildImageObjectSchemaFromUrl(
  url: string | null | undefined,
  options?: Omit<ImageObjectInput, 'url'>
): Record<string, unknown> | undefined {
  if (!url) return undefined;
  const schema = buildImageObjectSchema({ url, ...options });
  return Object.keys(schema).length ? schema : undefined;
}
