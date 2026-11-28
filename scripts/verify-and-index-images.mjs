/**
 * Verify working image URLs + IndexNow submit for all pages/blogs/images.
 * Converts cms|/wp-content uploads → /api/wp-media (proven 200 on live).
 */
const SITE = 'https://www.argroupofeducation.com';
const CMS = 'https://cms.argroupofeducation.com';
const KEY = 'argroup-indexnow-7f3c9e2b1d4a8';

function toApiMedia(url) {
  try {
    const u = new URL(url, SITE);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    let path = u.pathname;
    if (host === 'cms.argroupofeducation.com' || host === 'argroupofeducation.com') {
      if (path.includes('/wp-content/uploads/') && !path.includes('/uploads/colleges/')) {
        path = path.replace(/^\/wp-content\//i, '/api/wp-media/');
        return `${SITE}${path}${u.search}`;
      }
      if (path.startsWith('/api/wp-media/') || path.startsWith('/images/') || path.startsWith('/wp-content/uploads/colleges/')) {
        return `${SITE}${path}${u.search}`;
      }
      if (host === 'argroupofeducation.com') return `${SITE}${path}${u.search}`;
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (res.ok) return true;
    // some hosts dislike HEAD
    const g = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000) });
    return g.ok;
  } catch {
    return false;
  }
}

async function wpBlogUrls() {
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(
      `${CMS}/wp-json/wp/v2/posts?per_page=100&page=${page}&status=publish&_fields=slug,_links,_embedded&_embed=wp:featuredmedia`,
      { signal: AbortSignal.timeout(20000) },
    );
    if (!res.ok) break;
    const json = await res.json();
    if (!Array.isArray(json) || !json.length) break;
    for (const post of json) {
      if (post?.slug) out.push({ page: `${SITE}/blog/${encodeURIComponent(post.slug)}`, featured: post?._embedded?.['wp:featuredmedia']?.[0]?.source_url || null });
    }
    const total = parseInt(res.headers.get('x-wp-totalpages') || '1', 10) || 1;
    if (page >= total) break;
  }
  return out;
}

async function submitIndexNow(urls) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: 'www.argroupofeducation.com',
      key: KEY,
      keyLocation: `${SITE}/${KEY}.txt`,
      urlList: urls.slice(0, 10000),
    }),
  });
  return { status: res.status, ok: res.status === 200 || res.status === 202, count: urls.length };
}

async function main() {
  const [sitemapXml, imageXml, blogs] = await Promise.all([
    fetchText(`${SITE}/sitemap.xml`),
    fetchText(`${SITE}/sitemap-images.xml`),
    wpBlogUrls(),
  ]);

  const pageLocs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim());
  const imageLocs = [...imageXml.matchAll(/<image:loc>([^<]+)<\/image:loc>/gi)].map((m) =>
    m[1].trim().replace(/&amp;/g, '&'),
  );

  const urls = new Set([
    `${SITE}/`,
    `${SITE}/about`,
    `${SITE}/services`,
    `${SITE}/contact`,
    `${SITE}/blog`,
    `${SITE}/sitemap.xml`,
    `${SITE}/sitemap-images.xml`,
  ]);

  for (const u of pageLocs) urls.add(u.split('#')[0]);
  for (const b of blogs) urls.add(b.page);

  const media = new Set();
  for (const img of imageLocs) {
    const n = toApiMedia(img);
    if (n) media.add(n);
  }
  for (const b of blogs) {
    const n = toApiMedia(b.featured);
    if (n) media.add(n);
  }

  // Verify a sample of media URLs are HTTP 200
  const sample = [...media].slice(0, 20);
  let ok = 0;
  let bad = 0;
  const badList = [];
  for (const u of sample) {
    const good = await headOk(u);
    if (good) ok += 1;
    else {
      bad += 1;
      badList.push(u);
    }
  }

  for (const u of media) urls.add(u);

  const list = [...urls];
  const result = await submitIndexNow(list);

  console.log(
    JSON.stringify(
      {
        pages: pageLocs.length,
        blogs: blogs.length,
        imageSitemapFiles: imageLocs.length,
        mediaUrlsQueued: media.size,
        sampleProbe: { ok, bad, badList: badList.slice(0, 5) },
        indexNow: result,
        totalSubmitted: list.length,
      },
      null,
      2,
    ),
  );

  if (!result.ok || bad > ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
