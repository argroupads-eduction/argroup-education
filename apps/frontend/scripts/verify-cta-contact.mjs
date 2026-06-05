import pages from '../data/wp-export-bundle/pages.json' with { type: 'json' };
import posts from '../data/wp-export-bundle/posts.json' with { type: 'json' };
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const all = [...pages, ...posts];
let wired = 0;
let missing = 0;

for (const doc of all) {
  if (!doc.content?.includes('Get Consultation')) continue;
  const prepared = prepareWpHtml(doc.content, { title: doc.title });
  const anchors = prepared.match(/<a\b[^>]*elementor-button[^>]*>[\s\S]*?Get Consultation[\s\S]*?<\/a>/gi) || [];
  for (const a of anchors) {
    if (/href\s*=\s*["']\/contact["']/i.test(a)) wired += 1;
    else {
      missing += 1;
      console.log('MISSING', doc.slug, a.slice(0, 180));
    }
  }
}

console.log('wired', wired, 'missing', missing);
