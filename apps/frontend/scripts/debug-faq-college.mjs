import { readFileSync, writeFileSync } from 'fs';
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
const slug = process.argv[2] || 'lumbini-medical-college-palpa';
const doc = pages.find((p) => p.slug === slug);
if (!doc) {
  console.error('not found', slug);
  process.exit(1);
}

const raw = doc.content || '';
const out = prepareWpHtml(raw);
const faqIdx = Math.max(raw.search(/FAQs?/i), 0);
const outFaqIdx = Math.max(out.search(/FAQs?/i), 0);

writeFileSync(`./scripts/faq-raw-${slug}.html`, raw.slice(faqIdx, faqIdx + 8000));
writeFileSync(`./scripts/faq-out-${slug}.html`, out.slice(outFaqIdx, outFaqIdx + 8000));

const snippet = out.slice(outFaqIdx, outFaqIdx + 8000);
console.log({
  slug,
  detailsCount: (snippet.match(/<details class="wp-premium-faq"/g) || []).length,
  eaelLeft: snippet.includes('eael-adv-accordion'),
  schemaLeft: snippet.includes('schema-faq'),
  h3: (snippet.match(/<h[34]\b/gi) || []).length,
  anchors: (snippet.match(/<a\b/gi) || []).length,
  wpPremiumGroup: snippet.includes('wp-premium-faq-group'),
});
