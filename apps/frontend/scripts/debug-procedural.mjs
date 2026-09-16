import { readFileSync } from 'fs';
import {
  prepareWpHtml,
  normalizeAdmissionListItems,
  normalizeListItemSpans,
  transformLongListsToGrid,
} from '../lib/wpHtmlPrepare.ts';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
const doc = pages.find((p) => p.slug === 'mbbs-in-russia');
const needle = 'Fill out the online application form';
const idx = doc.content.indexOf(needle);
const chunk = doc.content.slice(idx - 200, idx + 800);
const m = chunk.match(/<ol\b[^>]*>([\s\S]*?)<\/ol>/i);
if (m) {
  let inner = m[1];
  inner = normalizeAdmissionListItems(`<ol>${inner}</ol>`).replace(/^<ol>|<\/ol>$/g, '');
  inner = normalizeListItemSpans(`<ol>${inner}</ol>`).replace(/^<ol>|<\/ol>$/g, '');
  console.log('after normalize:', inner.slice(0, 500));
  const out = transformLongListsToGrid(`<ol>${inner}</ol>`);
  console.log('grid:', out.slice(0, 500));
}
