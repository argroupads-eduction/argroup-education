import pages from '../data/wp-export-bundle/pages.json' with { type: 'json' };
import posts from '../data/wp-export-bundle/posts.json' with { type: 'json' };
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';
import { plainTextFromHtml } from '../lib/decodeHtmlEntities.ts';

const all = [...pages, ...posts];
const labels = [];
for (const doc of all) {
  const prepared = prepareWpHtml(doc.content || '', { title: doc.title });
  const anchors = prepared.match(/<a\b[^>]*elementor-button[^>]*>[\s\S]*?<\/a>/gi) || [];
  for (const a of anchors) {
    const text = plainTextFromHtml(a).trim();
    if (!/consult|counsell/i.test(text)) continue;
    if (!/href\s*=\s*["']\/contact["']/i.test(a)) {
      labels.push({ slug: doc.slug, text, snippet: a.slice(0, 160) });
    }
  }
}
console.log('Unlinked consultation buttons:', labels.length);
for (const x of labels.slice(0, 10)) console.log(x);
