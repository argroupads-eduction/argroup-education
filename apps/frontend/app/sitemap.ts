import type { MetadataRoute } from 'next';
import { buildSitemapEntries } from '@/lib/buildSitemapEntries';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

const VALID_CHANGEFREQ = new Set<NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>>([
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
]);

function toChangeFrequency(value: string): MetadataRoute.Sitemap[number]['changeFrequency'] {
  return VALID_CHANGEFREQ.has(value as NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>)
    ? (value as NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>)
    : 'weekly';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await buildSitemapEntries(getSiteUrl());
  return entries.map((entry) => ({
    url: entry.loc,
    lastModified: entry.lastmod,
    changeFrequency: toChangeFrequency(entry.changefreq),
    priority: entry.priority,
  }));
}
