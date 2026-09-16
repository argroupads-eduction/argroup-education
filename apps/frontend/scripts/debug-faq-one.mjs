import { readFileSync } from 'fs';
import { prepareWpHtml, transformWpFaqParagraphs } from '../lib/wpHtmlPrepare.ts';

const posts = JSON.parse(readFileSync('./data/wp-export-bundle/posts.json', 'utf8'));
const p = posts.find((x) => x.slug === 'neet-2026-result-date-and-time');
const html = p.content;
const re =
  /(<h[23][^>]*>[\s\S]*?\bFAQs?\b[\s\S]*?<\/h[23]>)(\s*)([\s\S]*?)(?=<div class="xs_social|<\/section>|<section\b|$)/i;
const m = html.match(re);
console.log('section match', Boolean(m));
if (m) {
  console.log('body preview', m[3].slice(0, 300));
}
const out = transformWpFaqParagraphs(html);
console.log('transformed', out.includes('wp-premium-faq-group'));
const full = prepareWpHtml(html);
console.log('prepareWpHtml', full.includes('wp-premium-faq-group'));
