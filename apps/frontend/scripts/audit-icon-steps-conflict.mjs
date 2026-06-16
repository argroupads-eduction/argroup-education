import { readFileSync } from 'fs';
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
let n = 0;
for (const doc of pages) {
  const out = prepareWpHtml(doc.content || '');
  if (/elementor-icon-list-items[^"]*wp-premium-steps-list|wp-premium-steps-list[^"]*elementor-icon-list-items/.test(out)) {
    n++;
  }
}
console.log('icon+steps conflict pages:', n, '/', pages.length);
