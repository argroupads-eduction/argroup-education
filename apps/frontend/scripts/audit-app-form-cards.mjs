import { readFileSync } from 'fs';
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const needle = 'Fill out the online application form';
const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
const posts = JSON.parse(readFileSync('./data/wp-export-bundle/posts.json', 'utf8'));

for (const doc of [...pages, ...posts]) {
  if (!(doc.content || '').includes(needle)) continue;
  const out = prepareWpHtml(doc.content);
  const idx = out.indexOf(needle);
  const chunk = out.slice(Math.max(0, idx - 120), idx + 200);
  const inFeature = /wp-premium-feature-grid[\s\S]{0,400}Fill out/.test(
    out.slice(Math.max(0, idx - 500), idx + 300)
  );
  const inChip = /wp-premium-chip-grid[\s\S]{0,400}Fill out/.test(
    out.slice(Math.max(0, idx - 500), idx + 300)
  );
  console.log(doc.slug, { inFeature, inChip, preview: chunk.replace(/\s+/g, ' ').slice(0, 120) });
}
