/** Single canonical site origin for metadata, sitemap, robots, JSON-LD. */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    'https://argroupofeducation.com';
  return raw.replace(/\/$/, '');
}
