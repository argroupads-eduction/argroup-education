import { buildRobotsTxt } from '@/lib/seoCrawlConfig';
import { getSiteUrl } from '@/lib/siteUrl';

export async function GET() {
  const robots = buildRobotsTxt(getSiteUrl());

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
