import type { MetadataRoute } from 'next';
import { LLM_CRAWLER_AGENTS, ROBOTS_DISALLOW_PREFIXES } from '@/lib/seoCrawlConfig';
import { getSiteUrl } from '@/lib/siteUrl';

export default function robots(): MetadataRoute.Robots {
  const disallow = [...ROBOTS_DISALLOW_PREFIXES];

  const rules: MetadataRoute.Robots['rules'] = [
    { userAgent: '*', allow: '/', disallow },
    { userAgent: 'Googlebot', allow: '/' },
    { userAgent: 'Bingbot', allow: '/' },
    ...LLM_CRAWLER_AGENTS.map((userAgent) => ({ userAgent, allow: '/' })),
  ];

  return {
    rules,
    sitemap: `${getSiteUrl()}/sitemap.xml`,
    host: getSiteUrl(),
  };
}
