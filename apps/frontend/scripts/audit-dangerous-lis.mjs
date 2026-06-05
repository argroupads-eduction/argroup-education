import pages from '../data/wp-export-bundle/pages.json' with { type: 'json' };
import posts from '../data/wp-export-bundle/posts.json' with { type: 'json' };
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

function directChildSpans(li) {
  const inner = li.replace(/^<li\b[^>]*>/i, '').replace(/<\/li>$/i, '');
  return (inner.match(/(?:^|>)\s*<span\b/gi) || []).length;
}

function isDangerousChipLi(li) {
  if (!li.includes('wp-premium-chip-grid')) return false;
  const inner = li.replace(/^<li\b[^>]*>/i, '').replace(/<\/li>$/i, '');
  const directSpans = (inner.match(/(?:^|>)\s*<span\b/gi) || []).length;
  if (directSpans >= 2) return true;
  if (/<span\b[\s\S]*?<span\b/i.test(inner) && directSpans >= 1) return true;
  if (/<span\b/i.test(inner) && /<(?:b|strong)\b/i.test(inner)) return true;
  return false;
}

const all = [
  ...pages.map((p) => ({ type: 'page', slug: p.slug, title: p.title, content: p.content })),
  ...posts.map((p) => ({ type: 'post', slug: p.slug, title: p.title, content: p.content })),
];

const dangerous = [];

for (const doc of all) {
  if (!doc.content) continue;
  const prepared = prepareWpHtml(doc.content, { title: doc.title });
  const chipBlocks = prepared.match(/<ul[^>]*wp-premium-chip-grid[^>]*>[\s\S]*?<\/ul>/gi) || [];
  for (const block of chipBlocks) {
    const lis = block.match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) || [];
    for (const li of lis) {
      if (isDangerousChipLi(li)) {
        dangerous.push({ slug: doc.slug, type: doc.type, li: li.slice(0, 400) });
      }
    }
  }
}

console.log('Dangerous chip-grid LIs:', dangerous.length);
for (const d of dangerous.slice(0, 15)) {
  console.log('\n', d.type, d.slug);
  console.log(d.li);
}
