import { readFileSync, writeFileSync } from 'fs';
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
for (const slug of ['mbbs-in-russia', 'study-mbbs-in-uzbekistan']) {
  const doc = pages.find((p) => p.slug === slug);
  const needle = 'Fill out the online application form';
  const idx = doc.content.indexOf(needle);
  writeFileSync(`./scripts/${slug}-raw.html`, doc.content.slice(idx - 800, idx + 3500));
  const out = prepareWpHtml(doc.content);
  const oidx = out.indexOf(needle);
  writeFileSync(`./scripts/${slug}-out.html`, out.slice(oidx - 800, oidx + 3500));
  console.log(slug, 'done');
}
