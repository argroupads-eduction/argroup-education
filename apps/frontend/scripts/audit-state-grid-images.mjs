import pages from '../data/wp-export-bundle/pages.json' with { type: 'json' };
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';
import { MBBS_INDIA_STATE_FEATURED_IMAGES } from '../lib/mbbsIndiaStateImages.ts';

const hub = pages.find((p) => p.slug === 'mbbs-in-india');
if (!hub) {
  console.error('mbbs-in-india not found');
  process.exit(1);
}

const out = prepareWpHtml(hub.content, { pageSlug: 'mbbs-in-india', title: hub.title });
const stateSlugs = Object.keys(MBBS_INDIA_STATE_FEATURED_IMAGES).filter((s) => s !== 'mbbs-in-india');

let ok = 0;
let missing = 0;
for (const slug of stateSlugs) {
  const img = MBBS_INDIA_STATE_FEATURED_IMAGES[slug];
  const inGrid = out.includes(img);
  const legacyUpload = new RegExp(`mbbs-in-${slug.replace('mbbs-in-', '')}[^"']*wp-content/uploads`, 'i').test(hub.content);
  if (inGrid) ok++;
  else if (legacyUpload || hub.content.includes(slug)) {
    console.log('MISSING grid image for', slug);
    missing++;
  }
}

const wpUploadsInOut = (out.match(/wp-content\/uploads[^"']+\.(?:jpg|jpeg|png|webp)/gi) || []).filter(
  (u) => !/elementor\/thumbs/i.test(u)
);
const gridSection = out.includes('wp-state-landmark-img');

console.log('Grid landmark class present:', gridSection);
console.log('States with landmark in prepared HTML:', ok);
console.log('States missing:', missing);
console.log('Non-thumb WP uploads remaining in hub body:', wpUploadsInOut.length);
if (wpUploadsInOut.length) console.log(wpUploadsInOut.slice(0, 5));

const statePages = pages.filter((p) => p.slug?.startsWith('mbbs-in-') && p.slug !== 'mbbs-in-india');
let stateOk = 0;
let stateBad = 0;
for (const page of statePages) {
  const expected = MBBS_INDIA_STATE_FEATURED_IMAGES[page.slug];
  if (!expected) continue;
  const prepared = prepareWpHtml(page.content, { pageSlug: page.slug, title: page.title });
  const hasLandmark = prepared.includes(expected);
  const oldHero = /<img[^>]+wp-content\/uploads[^>]+>/i.test(prepared.replace(/elementor\/thumbs[^"']+/gi, ''));
  if (hasLandmark && !oldHero) stateOk++;
  else {
    stateBad++;
    console.log('STATE ISSUE', page.slug, { hasLandmark, oldHero });
  }
}
console.log('State pages OK:', stateOk, 'issues:', stateBad);
