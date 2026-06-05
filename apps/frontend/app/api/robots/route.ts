import { getSiteUrl } from '@/lib/siteUrl';

export async function GET() {
  const baseUrl = getSiteUrl();

  const robots = `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Disallow: /admin
Disallow: /api
Disallow: /private

Sitemap: ${baseUrl}/sitemap.xml`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
