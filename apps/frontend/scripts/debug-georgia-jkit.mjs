import { readFileSync, writeFileSync } from 'fs';
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
const doc = pages.find((p) => p.slug === 'mbbs-in-georgia');
const idx = doc.content.indexOf('Get Consultation');
writeFileSync('./scripts/georgia-jkit-raw.html', doc.content.slice(idx - 2500, idx + 2500));
const out = prepareWpHtml(doc.content);
const oidx = out.indexOf('Get Consultation');
writeFileSync('./scripts/georgia-jkit-out.html', out.slice(oidx - 2500, oidx + 2500));
