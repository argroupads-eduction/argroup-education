import type { MetadataRoute } from 'next';
import {
  IMAGE_SITEMAP_PATH,
  LLM_CRAWLER_AGENTS,
  ROBOTS_DISALLOW_PREFIXES,
} from '@/lib/seoCrawlConfig';
import { getSiteUrl } from '@/lib/siteUrl';

export default function robots(): MetadataRoute.Robots {
  const disallow = [...ROBOTS_DISALLOW_PREFIXES];
  const siteUrl = getSiteUrl();

  const rules: MetadataRoute.Robots['rules'] = [
    { userAgent: '*', allow: '/', disallow },
    { userAgent: 'Googlebot', allow: '/', disallow },
    { userAgent: 'Bingbot', allow: '/', disallow },
    ...LLM_CRAWLER_AGENTS.map((userAgent) => ({ userAgent, allow: '/', disallow })),
  ];

  return {
    rules,
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}${IMAGE_SITEMAP_PATH}`],
    host: siteUrl,
  };
}
