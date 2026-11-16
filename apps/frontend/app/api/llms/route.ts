import { buildLlmsTxt } from '@/lib/seoCrawlConfig';
import { getSiteUrl } from '@/lib/siteUrl';

export async function GET() {
  const body = buildLlmsTxt(getSiteUrl());

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
