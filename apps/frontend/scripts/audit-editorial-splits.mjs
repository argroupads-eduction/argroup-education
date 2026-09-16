import { readFileSync } from 'fs';
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
let withSplit = 0;
const samples = [];

for (const doc of pages) {
  const out = prepareWpHtml(doc.content || '');
  const hasSplit =
    /elementor-col-50[\s\S]{0,2500}elementor-widget-image[\s\S]{0,1200}Get Consultation/i.test(out);
  if (!hasSplit) continue;
  withSplit++;
  if (samples.length < 12) samples.push(doc.slug);
}

console.log({ total: pages.length, withSplit, samples });
