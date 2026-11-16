import { readFileSync } from 'fs';
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
let count = 0;
for (const doc of pages) {
  const out = prepareWpHtml(doc.content || '');
  const re = /<(?:ul|ol)\s+class="[^"]*wp-premium-feature-grid[^"]*">([\s\S]*?)<\/(?:ul|ol)>/gi;
  let m;
  while ((m = re.exec(out)) !== null) {
    const liCount = (m[1].match(/<li\b/gi) || []).length;
    if (liCount === 1) {
      count++;
      console.log(doc.slug, strip(m[1]).slice(0, 80));
    }
  }
}
console.log('singleton feature grids:', count);

function strip(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
