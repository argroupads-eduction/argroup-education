import { readFileSync } from 'fs';
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
const posts = JSON.parse(readFileSync('./data/wp-export-bundle/posts.json', 'utf8'));
const all = [...pages, ...posts];

const missed = [];
let withFaq = 0;
let hasGroup = 0;

for (const doc of all) {
  const raw = doc.content || '';
  if (!/\bFAQs?\b/i.test(raw) && !/Q\s*\d+\s*[.:]/i.test(raw)) continue;
  withFaq++;
  const out = prepareWpHtml(raw);
  if (out.includes('wp-premium-faq-group')) {
    hasGroup++;
    continue;
  }
  if (/eael-adv-accordion/i.test(raw)) {
    missed.push({ slug: doc.slug, type: 'eael-unconverted' });
    continue;
  }
  if (/Q\s*\d+/i.test(raw)) {
    const idx = raw.search(/FAQ/i);
    missed.push({
      slug: doc.slug,
      type: 'q-pattern',
      sample: raw.slice(Math.max(0, idx - 20), idx + 400).replace(/\s+/g, ' '),
    });
  }
}

console.log('with FAQ-ish content:', withFaq);
console.log('with accordion group:', hasGroup);
console.log('missed:', missed.length);
console.log(JSON.stringify(missed.slice(0, 8), null, 2));
