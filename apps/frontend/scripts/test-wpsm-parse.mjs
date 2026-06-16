import { readFileSync } from 'fs';
import { transformWpsmAccordions, prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
const doc = pages.find((p) => p.slug === 'lumbini-medical-college-palpa');
const out = transformWpsmAccordions(doc.content);
const faqIdx = out.search(/FAQs?/i);
const area = out.slice(faqIdx, faqIdx + 6000);
console.log({
  hasGroup: area.includes('wp-premium-faq-group'),
  details: (area.match(/<details class="wp-premium-faq"/g) || []).length,
  wpsmLeft: area.includes('wpsm_panel'),
  preview: area.replace(/\s+/g, ' ').slice(0, 500),
});
