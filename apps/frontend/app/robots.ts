import type { MetadataRoute } from 'next';
import {
  IMAGE_SITEMAP_PATH,
  LLM_CRAWLER_AGENTS,
  ROBOTS_DISALLOW_PREFIXES,
  ROBOTS_IMAGE_ALLOW_PREFIXES,
} from '@/lib/seoCrawlConfig';
import { getSiteUrl } from '@/lib/siteUrl';

export default function robots(): MetadataRoute.Robots {
  const disallow = [...ROBOTS_DISALLOW_PREFIXES];
  const imageAllow = ROBOTS_IMAGE_ALLOW_PREFIXES.filter((p) => p !== '/');
  const siteUrl = getSiteUrl();

  const rules: MetadataRoute.Robots['rules'] = [
    { userAgent: '*', allow: ['/', ...imageAllow], disallow },
    { userAgent: 'Googlebot', allow: ['/', ...imageAllow], disallow },
    {
      userAgent: 'Googlebot-Image',
      allow: ['/', ...imageAllow],
      disallow: ['/admin/', '/private/', '/thank-you'],
    },
    { userAgent: 'Bingbot', allow: ['/', ...imageAllow], disallow },
    ...LLM_CRAWLER_AGENTS.map((userAgent) => ({
      userAgent,
      allow: '/',
      disallow,
    })),
  ];

  return {
    rules,
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}${IMAGE_SITEMAP_PATH}`],
    host: siteUrl,
  };
}
