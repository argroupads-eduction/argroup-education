import { readFileSync } from 'fs';
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
let feature = 0;
let chip = 0;
let steps = 0;
for (const doc of pages) {
  const out = prepareWpHtml(doc.content || '');
  feature += (out.match(/wp-premium-feature-grid/g) || []).length;
  chip += (out.match(/wp-premium-chip-grid/g) || []).length;
  steps += (out.match(/wp-premium-steps-list/g) || []).length;
}
console.log({ pages: pages.length, feature, chip, steps });
