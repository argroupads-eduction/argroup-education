/**
 * Submit every page URL + image sitemap pages to IndexNow so Google/Bing
 * can discover homepage, about, all pages, all blogs, and their images.
 *
 * Usage: node scripts/index-all-images-and-pages.mjs
 */
const SITE = (process.env.SITE_URL || 'https://www.argroupofeducation.com').replace(/\/$/, '');
const CMS = 'https://cms.argroupofeducation.com';
const KEY =
  process.env.INDEXNOW_KEY?.trim() ||
  process.env.NEXT_PUBLIC_INDEXNOW_KEY?.trim() ||
  'argroup-indexnow-7f3c9e2b1d4a8';

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/xml,text/xml,application/json,*/*' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

function locsFromXml(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim()).filter(Boolean);
}

function imageLocsFromXml(xml) {
  return [...xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/gi)].map((m) =>
    m[1].trim().replace(/&amp;/g, '&'),
  );
}

/** IndexNow only accepts URLs on SITE host. */
function toIndexNowUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    let path = u.pathname;
    if (host === 'cms.argroupofeducation.com' && path.includes('/wp-content/')) {
      path = path.replace(/^\/wp-content\//i, '/api/wp-media/');
      return `${SITE}${path}${u.search}`;
    }
    if (host === 'argroupofeducation.com') {
      if (path.includes('/wp-content/uploads/') && !path.includes('/uploads/colleges/')) {
        path = path.replace(/^\/wp-content\//i, '/api/wp-media/');
      }
      return `${SITE}${path}${u.search}`;
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchWpBlogPageUrls() {
  const urls = [];
  let page = 1;
  while (page <= 20) {
    const endpoint = `${CMS}/wp-json/wp/v2/posts?per_page=100&page=${page}&status=publish&_fields=slug`;
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) break;
    const json = await res.json();
    if (!Array.isArray(json) || !json.length) break;
    for (const post of json) {
      if (post?.slug) urls.push(`${SITE}/blog/${encodeURIComponent(post.slug)}`);
    }
    const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10) || 1;
    if (page >= totalPages) break;
    page += 1;
  }
  return urls;
}

async function submitIndexNow(urls) {
  const host = new URL(SITE).host;
  const keyLocation = `${SITE}/${KEY}.txt`;
  const chunkSize = 9000;
  const results = [];
  for (let i = 0; i < urls.length; i += chunkSize) {
    const urlList = urls.slice(i, i + chunkSize);
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key: KEY, keyLocation, urlList }),
    });
    const text = await res.text().catch(() => '');
    results.push({
      batch: Math.floor(i / chunkSize) + 1,
      count: urlList.length,
      status: res.status,
      ok: res.status === 200 || res.status === 202,
      body: text.slice(0, 160),
    });
  }
  return results;
}

async function main() {
  console.log('Site:', SITE);

  const keyCheck = await fetch(`${SITE}/${KEY}.txt`);
  const keyBody = (await keyCheck.text()).trim();
  if (!keyCheck.ok || keyBody !== KEY) {
    throw new Error(`IndexNow key mismatch: ${keyCheck.status} ${keyBody}`);
  }

  const [sitemapXml, imageXml, wpBlogs] = await Promise.all([
    fetchText(`${SITE}/sitemap.xml`),
    fetchText(`${SITE}/sitemap-images.xml`),
    fetchWpBlogPageUrls().catch((err) => {
      console.warn('WP blog list failed', err.message);
      return [];
    }),
  ]);

  const pageLocs = locsFromXml(sitemapXml);
  const imagePageLocs = locsFromXml(imageXml); // <url><loc> page URLs
  const imageFileLocs = imageLocsFromXml(imageXml);

  const corePages = [
    `${SITE}/`,
    `${SITE}/about`,
    `${SITE}/services`,
    `${SITE}/contact`,
    `${SITE}/blog`,
    `${SITE}/mbbs-india`,
    `${SITE}/mbbs-abroad`,
    `${SITE}/md-ms`,
    `${SITE}/sitemap.xml`,
    `${SITE}/sitemap-images.xml`,
  ];

  const all = new Set();
  for (const u of [...corePages, ...pageLocs, ...imagePageLocs, ...wpBlogs]) {
    const n = toIndexNowUrl(u) || (u.startsWith(SITE) ? u : null);
    if (n) all.add(n.split('#')[0]);
  }
  // Same-origin mirrors of image files (for Image Search discovery after proxy deploy)
  for (const img of imageFileLocs) {
    const n = toIndexNowUrl(img);
    if (n) all.add(n.split('#')[0]);
  }

  const urls = [...all].sort();
  console.log({
    sitemapPages: pageLocs.length,
    imageSitemapPages: imagePageLocs.length,
    imageFiles: imageFileLocs.length,
    wpBlogs: wpBlogs.length,
    indexNowUrls: urls.length,
  });

  const results = await submitIndexNow(urls);
  console.log('IndexNow:', JSON.stringify(results, null, 2));
  const ok = results.every((r) => r.ok);
  console.log(ok ? `DONE — submitted ${urls.length} URLs` : 'DONE WITH ERRORS');
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
