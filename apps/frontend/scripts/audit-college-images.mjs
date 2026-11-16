import { readFileSync } from 'node:fs';
import { resolveCollegeImageUrl } from '../lib/collegeImageIndex.ts';
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';
import { parseContentStructure } from '../lib/wpContentStructure.ts';

const india = JSON.parse(readFileSync('data/mbbs-india-tree.json', 'utf8'));
const index = JSON.parse(readFileSync('data/college-image-index.json', 'utf8'));

const junkRe =
  /untitled|mbbs-in-russia|study-mbbs-in-russia|apply-mbbs|studying-mbbs|mbbs-in-abroad|pleased-young-female-doctor|smiling-young-female-doctor|young-female-doctor|\/up\.png|\/mp-|mbbs-russia|mbbs-in-up\.png|doctor-with-thumbs|front-view-nurses/i;

const bad = [];
for (const state of india.states) {
  for (const c of state.colleges) {
    const resolved = resolveCollegeImageUrl(c.slug, c.image);
    const path = index.bySlug[c.slug] ?? c.image ?? '';
    if (!resolved || junkRe.test(String(path)) || junkRe.test(String(c.image))) {
      bad.push({ name: c.name, slug: c.slug, image: path || c.image });
    }
  }
}

console.log('suspicious india colleges', bad.length);
console.log(bad.slice(0, 25));
