import { readFileSync, writeFileSync } from 'fs';
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
const slug = 'study-mbbs-in-uzbekistan';
const doc = pages.find((p) => p.slug === slug);
for (const needle of ['Documents Required for Student Visa', 'Contact Us Now', 'Get Consultation']) {
  const idx = doc.content.indexOf(needle);
  if (idx < 0) continue;
  writeFileSync(`./scripts/uz-${needle.slice(0, 12).replace(/\s/g, '-')}-raw.html`, doc.content.slice(idx - 200, idx + 3500));
  const out = prepareWpHtml(doc.content);
  const oidx = out.indexOf(needle);
  writeFileSync(`./scripts/uz-${needle.slice(0, 12).replace(/\s/g, '-')}-out.html`, out.slice(oidx - 200, oidx + 3500));
  console.log(needle, 'found');
}
