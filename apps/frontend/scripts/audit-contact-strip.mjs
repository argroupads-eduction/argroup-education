import pages from '../data/wp-export-bundle/pages.json' with { type: 'json' };
import posts from '../data/wp-export-bundle/posts.json' with { type: 'json' };
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const all = [...pages, ...posts];
let strips = 0;
let linked = 0;

for (const doc of all) {
  if (!doc.content?.includes('Contact Us Now')) continue;
  const h = prepareWpHtml(doc.content, { title: doc.title });
  if (!h.includes('wp-contact-strip')) continue;
  strips += 1;
  const links = h.match(/wp-contact-card-link[^>]*href="[^"]+"/gi) || [];
  linked += links.length;
}

console.log('pages with contact strip:', strips);
console.log('contact links:', linked);
