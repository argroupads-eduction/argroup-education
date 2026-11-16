import pages from '../data/wp-export-bundle/pages.json' with { type: 'json' };
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const slug = process.argv[2] || 'mbbs-in-up';
const page = pages.find((p) => p.slug === slug);
if (!page) process.exit(1);

const idx = page.content.search(/Contact Us Now/i);
const chunk = page.content.slice(idx, idx + 2500);
console.log('=== RAW ===');
console.log(chunk.slice(0, 2000));

const prepared = prepareWpHtml(page.content, { title: page.title });
const pidx = prepared.search(/Contact Us Now/i);
const pchunk = prepared.slice(pidx, pidx + 2000);
console.log('\n=== PREPARED ===');
console.log(pchunk.slice(0, 2000));
