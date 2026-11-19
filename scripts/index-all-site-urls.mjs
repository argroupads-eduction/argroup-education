/**
 * Submit every public sitemap URL to IndexNow + ping Bing/Google sitemap endpoints.
 *
 * Usage: node scripts/index-all-site-urls.mjs
 */
const SITE = (process.env.SITE_URL || 'https://www.argroupofeducation.com').replace(/\/$/, '');
const KEY =
  process.env.INDEXNOW_KEY?.trim() ||
  process.env.NEXT_PUBLIC_INDEXNOW_KEY?.trim() ||
  'argroup-indexnow-7f3c9e2b1d4a8';

async function fetchSitemapUrls(sitemapUrl) {
  const res = await fetch(sitemapUrl, {
    headers: { Accept: 'application/xml,text/xml,*/*' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`sitemap ${sitemapUrl} → ${res.status}`);
  const xml = await res.text();

  // Sitemap index → recurse
  const sitemapRefs = [...xml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/gi)].map((m) =>
    m[1].trim(),
  );
  if (sitemapRefs.length) {
    const nested = [];
    for (const ref of sitemapRefs) {
      nested.push(...(await fetchSitemapUrls(ref)));
    }
    return nested;
  }

  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim()).filter(Boolean);
}

async function submitIndexNow(urls) {
  const host = new URL(SITE).host;
  const keyLocation = `${SITE}/${KEY}.txt`;
  const chunkSize = 10000;
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
      body: text.slice(0, 200),
    });
  }
  return results;
}

async function pingSitemap(engine, pingUrl) {
  try {
    const res = await fetch(pingUrl, { method: 'GET', redirect: 'follow' });
    return { engine, status: res.status, ok: res.ok || res.status === 200 };
  } catch (err) {
    return { engine, ok: false, error: String(err?.message || err) };
  }
}

async function main() {
  console.log('Site:', SITE);
  console.log('IndexNow key:', KEY);

  const keyCheck = await fetch(`${SITE}/${KEY}.txt`);
  const keyBody = (await keyCheck.text()).trim();
  console.log('Key file:', keyCheck.status, keyBody === KEY ? 'OK' : `MISMATCH (${keyBody})`);
  if (!keyCheck.ok || keyBody !== KEY) {
    throw new Error('IndexNow key file missing or mismatched on live site');
  }

  const sitemapCandidates = [`${SITE}/sitemap.xml`, `${SITE}/sitemap`];
  let urls = [];
  let used = '';
  for (const candidate of sitemapCandidates) {
    try {
      urls = await fetchSitemapUrls(candidate);
      if (urls.length) {
        used = candidate;
        break;
      }
    } catch (err) {
      console.warn('sitemap miss', candidate, err.message);
    }
  }

  // Also pull image sitemap locs (page URLs only)
  try {
    const imageUrls = await fetchSitemapUrls(`${SITE}/sitemap-images.xml`);
    urls.push(...imageUrls);
  } catch {
    /* optional */
  }

  const unique = [...new Set(urls.map((u) => u.split('#')[0]))].filter((u) =>
    u.startsWith(SITE),
  );
  unique.sort();

  console.log(`Sitemap source: ${used || 'n/a'}`);
  console.log(`Unique URLs: ${unique.length}`);
  if (!unique.length) throw new Error('No URLs found');

  const indexNow = await submitIndexNow(unique);
  console.log('IndexNow batches:', JSON.stringify(indexNow, null, 2));

  const sitemapParam = encodeURIComponent(`${SITE}/sitemap.xml`);
  const pings = await Promise.all([
    pingSitemap('bing', `https://www.bing.com/indexnow?url=${encodeURIComponent(unique[0])}&key=${KEY}`),
    pingSitemap('bing-sitemap', `https://www.bing.com/ping?sitemap=${sitemapParam}`),
    pingSitemap('google-sitemap', `https://www.google.com/ping?sitemap=${sitemapParam}`),
  ]);
  console.log('Pings:', JSON.stringify(pings, null, 2));

  const ok = indexNow.every((b) => b.ok);
  console.log(ok ? `DONE — submitted ${unique.length} URLs` : 'DONE WITH ERRORS');
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
