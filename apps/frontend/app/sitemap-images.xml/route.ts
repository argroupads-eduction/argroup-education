import { buildImageSitemapEntries } from '@/lib/buildImageSitemapEntries';
import { IMAGE_SITEMAP_PATH } from '@/lib/seoCrawlConfig';
import { getSiteUrl } from '@/lib/siteUrl';

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

/** Google image sitemap — dynamic, all indexable page images. */
export async function GET() {
  const baseUrl = getSiteUrl();
  const pages = await buildImageSitemapEntries(baseUrl);

  const urlBlocks = pages
    .map((page) => {
      const imageTags = page.images
        .map((img) => {
          const title = img.title ? `\n      <image:title>${escapeXml(img.title)}</image:title>` : '';
          const caption = img.caption
            ? `\n      <image:caption>${escapeXml(img.caption)}</image:caption>`
            : '';
          return `    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>${title}${caption}
    </image:image>`;
        })
        .join('\n');

      const lastmod = page.lastmod ? `\n    <lastmod>${escapeXml(page.lastmod)}</lastmod>` : '';

      return `  <url>
    <loc>${escapeXml(page.pageLoc)}</loc>${lastmod}
${imageTags}
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlBlocks}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Sitemap-Type': 'image',
      'X-Sitemap-Path': IMAGE_SITEMAP_PATH,
    },
  });
}
