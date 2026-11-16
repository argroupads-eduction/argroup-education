import pages from '../data/wp-export-bundle/pages.json' with { type: 'json' };
import posts from '../data/wp-export-bundle/posts.json' with { type: 'json' };
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';
import { plainTextFromHtml } from '../lib/decodeHtmlEntities.ts';

const all = [...pages, ...posts];
const bad = [];

for (const doc of all) {
  if (!doc.content) continue;
  const prepared = prepareWpHtml(doc.content, { title: doc.title });
  const blocks = prepared.match(/<ul[^>]*wp-premium-icon-chip-grid[^>]*>[\s\S]*?<\/ul>/gi) || [];
  for (const block of blocks) {
    const lis = block.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];
    const empty = lis.filter((li) => plainTextFromHtml(li).trim().length < 2);
    if (empty.length) bad.push({ slug: doc.slug, empty: empty.length, total: lis.length });
  }
}

console.log('Icon chip grids with empty items:', bad.length);
console.log(JSON.stringify(bad.slice(0, 20), null, 2));
