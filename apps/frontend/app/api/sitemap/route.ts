import { buildDynamicSitemap } from '@backend/handlers/siteSearch';
import { getSupplementalSitemapEntries } from '@/lib/seoCrawlConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function mergeSitemapEntries(
  ...groups: { loc: string; lastmod: string; changefreq: string; priority: number }[][]
) {
  const seen = new Set<string>();
  const merged: typeof groups[number] = [];
  for (const group of groups) {
    for (const entry of group) {
      if (seen.has(entry.loc)) continue;
      seen.add(entry.loc);
      merged.push(entry);
    }
  }
  return merged;
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://argroupofeducation.com';

  try {
    const [dynamicEntries, supplementalEntries] = await Promise.all([
      buildDynamicSitemap(baseUrl),
      Promise.resolve(getSupplementalSitemapEntries(baseUrl)),
    ]);
    const entries = mergeSitemapEntries(supplementalEntries, dynamicEntries);

    const urlBlocks = entries
      .map(
        (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlBlocks}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[sitemap]', error);
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(baseUrl)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    return new Response(fallback, {
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
