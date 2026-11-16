import { readFileSync, writeFileSync } from 'fs';
import { prepareWpHtml, transformLongListsToGrid } from '../lib/wpHtmlPrepare.ts';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
const slug = 'yaroslav-the-wise-novgorod-state-medical-university';
const doc = pages.find((p) => p.slug === slug);
const needle = 'Fill out the online application form';
const idx = doc.content.indexOf(needle);
writeFileSync('./scripts/app-form-raw.html', doc.content.slice(idx - 1500, idx + 2500));

const beforeGrid = doc.content; // can't easily get intermediate
const out = prepareWpHtml(doc.content);
writeFileSync('./scripts/app-form-out.html', out.slice(out.indexOf(needle) - 1500, out.indexOf(needle) + 2500));
console.log('done', slug);
