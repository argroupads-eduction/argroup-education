import pages from '../data/wp-export-bundle/pages.json' with { type: 'json' };
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const slug = process.argv[2] || 'saraswathi-institute-of-medical-sciences-hapur';
const page = pages.find((p) => p.slug === slug);
if (!page) { console.log('not found'); process.exit(1); }

const idx = page.content.search(/Curriculum|Documents Required|In Campus/i);
const chunk = page.content.slice(idx, idx + 10000);
const uls = chunk.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi) || [];
console.log('=== RAW ULs', uls.length, '===');
for (const ul of uls.slice(0, 2)) {
  console.log(ul.slice(0, 1800));
  const lis = ul.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];
  console.log('count', lis.length, 'first li:', lis[0]?.slice(0, 400));
}

const prepared = prepareWpHtml(page.content, { title: page.title });
const pidx = prepared.search(/Curriculum|Documents Required|In Campus/i);
const pchunk = prepared.slice(pidx, pidx + 8000);
const grids = pchunk.match(/<ul[^>]*wp-premium[^>]*>[\s\S]*?<\/ul>/gi) || [];
console.log('\n=== PREPARED grids', grids.length, '===');
for (const g of grids.slice(0, 2)) {
  console.log(g.slice(0, 1800));
}
