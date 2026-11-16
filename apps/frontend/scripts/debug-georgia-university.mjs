import { readFileSync, writeFileSync } from 'fs';
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
const doc = pages.find((p) => p.slug === 'mbbs-in-georgia');
const out = prepareWpHtml(doc.content);
const needle = 'Ivane Javakhishvili';
const idx = out.indexOf(needle);
writeFileSync('./scripts/georgia-university-block.html', out.slice(idx - 500, idx + 8000));
console.log('idx', idx);
console.log('col-50', (out.match(/elementor-col-50/g) || []).length);
console.log('feature-grid', (out.match(/wp-premium-feature-grid/g) || []).length);
console.log('inner-section', (out.match(/elementor-inner-section/g) || []).length);
