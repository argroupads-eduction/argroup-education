import pages from '../data/wp-export-bundle/pages.json' with { type: 'json' };
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const slug = process.argv[2] || 'samara-state-medical-university';
const page = pages.find((p) => p.slug === slug);
if (!page) process.exit(1);

const idx = page.content.search(/Documents Required/i);
const chunk = page.content.slice(idx, idx + 12000);
const ul = chunk.match(/<ul[^>]*>[\s\S]*?<\/ul>/i);
console.log('=== RAW first UL near Documents ===');
console.log(ul ? ul[0].slice(0, 3000) : 'none');

const prepared = prepareWpHtml(page.content, { title: page.title });
const pidx = prepared.search(/Documents Required/i);
const pchunk = prepared.slice(pidx, pidx + 6000);
const chip = pchunk.match(/<ul[^>]*wp-premium[^>]*>[\s\S]*?<\/ul>/i);
console.log('\n=== PREPARED grid ===');
console.log(chip ? chip[0].slice(0, 3000) : 'none');

const lis = (chip?.[0].match(/<li[^>]*>[\s\S]*?<\/li>/gi) || []).slice(0, 3);
for (const li of lis) console.log('\nLI:', li.slice(0, 600));
