import pages from '../data/wp-export-bundle/pages.json' with { type: 'json' };
import posts from '../data/wp-export-bundle/posts.json' with { type: 'json' };
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

function multiSpanLis(html) {
  return (html.match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) || []).filter(
    (li) => (li.match(/<span\b/gi) || []).length >= 2
  ).length;
}

function gridCounts(html) {
  const chip = (html.match(/wp-premium-chip-grid/gi) || []).length;
  const feature = (html.match(/wp-premium-feature-grid/gi) || []).length;
  return { chip, feature };
}

const all = [
  ...pages.map((p) => ({ type: 'page', slug: p.slug, title: p.title, content: p.content })),
  ...posts.map((p) => ({ type: 'post', slug: p.slug, title: p.title, content: p.content })),
];

let rawMultiSpan = 0;
let preparedMultiSpan = 0;
let chipGrids = 0;
let featureGrids = 0;
const samples = [];

for (const doc of all) {
  if (!doc.content) continue;
  const raw = multiSpanLis(doc.content);
  const prepared = prepareWpHtml(doc.content, { title: doc.title });
  const prepMulti = multiSpanLis(prepared);
  const grids = gridCounts(prepared);

  rawMultiSpan += raw;
  preparedMultiSpan += prepMulti;
  chipGrids += grids.chip;
  featureGrids += grids.feature;

  if (prepMulti > 0 || (grids.chip > 0 && raw > 0)) {
    samples.push({
      type: doc.type,
      slug: doc.slug,
      rawMulti: raw,
      prepMulti: prepMulti,
      ...grids,
    });
  }
}

console.log('Documents:', all.length);
console.log('Raw multi-span LIs (total across docs):', rawMultiSpan);
console.log('Prepared multi-span LIs remaining:', preparedMultiSpan);
console.log('Chip grids in prepared HTML:', chipGrids);
console.log('Feature grids in prepared HTML:', featureGrids);
console.log('\nSamples still with multi-span or chip after raw multi-span:');
console.log(JSON.stringify(samples.slice(0, 25), null, 2));
if (samples.length > 25) console.log(`... and ${samples.length - 25} more`);
