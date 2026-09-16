#!/usr/bin/env node
/**
 * Image SEO audit — run from apps/frontend:
 *   node scripts/audit-image-seo.mjs
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');

async function main() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const report = {
    baseUrl,
    timestamp: new Date().toISOString(),
    urlSitemap: null,
    imageSitemap: null,
    robots: null,
    errors: [],
  };

  try {
    const urlRes = await fetch(`${baseUrl}/sitemap.xml`);
    report.urlSitemap = { status: urlRes.status, ok: urlRes.ok };
    if (!urlRes.ok) report.errors.push(`sitemap.xml returned ${urlRes.status}`);
  } catch (e) {
    report.errors.push(`sitemap.xml fetch failed: ${e.message}`);
  }

  try {
    const imgRes = await fetch(`${baseUrl}/sitemap-images.xml`);
    const text = await imgRes.text();
    const imageLocCount = (text.match(/<image:loc>/g) || []).length;
    const pageLocCount = (text.match(/<loc>/g) || []).length - imageLocCount;
    report.imageSitemap = {
      status: imgRes.status,
      ok: imgRes.ok,
      pagesWithImages: pageLocCount,
      totalImages: imageLocCount,
    };
    if (!imgRes.ok) report.errors.push(`sitemap-images.xml returned ${imgRes.status}`);
  } catch (e) {
    report.errors.push(`sitemap-images.xml fetch failed: ${e.message}`);
  }

  try {
    const robotsRes = await fetch(`${baseUrl}/robots.txt`);
    const robotsText = await robotsRes.text();
    report.robots = {
      status: robotsRes.status,
      hasImageSitemap: robotsText.includes('sitemap-images'),
      blocksWpContent: /Disallow:\s*\/wp-content/i.test(robotsText),
      blocksImages: /Disallow:\s*\/images/i.test(robotsText),
    };
  } catch (e) {
    report.errors.push(`robots.txt fetch failed: ${e.message}`);
  }

  try {
    const indexRaw = await readFile(
      path.join(frontendRoot, 'data/college-image-index.json'),
      'utf8'
    );
    const index = JSON.parse(indexRaw);
    report.collegeImageIndexCount = index.count ?? Object.keys(index.bySlug ?? {}).length;
  } catch {
    report.collegeImageIndexCount = 0;
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.errors.length ? 1 : 0);
}

main();
