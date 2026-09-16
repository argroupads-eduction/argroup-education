import pages from '../data/wp-export-bundle/pages.json' with { type: 'json' };
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const slug = process.argv[2] || 'siberian-state-medical-university-russia';
const page = pages.find((p) => p.slug === slug);
if (!page) {
  console.log('not found');
  process.exit(1);
}

const prepared = prepareWpHtml(page.content, { title: page.title });
const lis = prepared.match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) || [];
const multi = lis.filter((li) => (li.match(/<span\b/gi) || []).length >= 2);
console.log('remaining multi-span:', multi.length);
for (const li of multi.slice(0, 5)) {
  console.log('\n---');
  console.log(li.slice(0, 1200));
}
