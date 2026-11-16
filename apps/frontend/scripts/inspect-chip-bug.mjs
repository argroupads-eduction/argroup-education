import pages from '../data/wp-export-bundle/pages.json' with { type: 'json' };
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const slugs = ['kazan-federal-medical-university-russia', 'privolzhsky-research-medical-university'];

for (const slug of slugs) {
  const page = pages.find((p) => p.slug === slug);
  if (!page) continue;
  console.log('\n===', slug, '===');

  const supportIdx = page.content.search(/Student Support|Free Counseling|Counseling/i);
  const chunk = page.content.slice(Math.max(0, supportIdx - 200), supportIdx + 4000);
  const ulMatches = chunk.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi) || [];
  for (const ul of ulMatches.slice(0, 3)) {
    console.log('\n--- UL ---');
    console.log(ul.slice(0, 1500));
    const liWithMultiSpan = ul.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];
    for (const li of liWithMultiSpan.filter((x) => (x.match(/<span/gi) || []).length >= 2).slice(0, 2)) {
      console.log('\nLI multi-span:', li.slice(0, 800));
    }
  }

  const prepared = prepareWpHtml(page.content);
  const idx = prepared.search(/Student Support|Free Counseling|Counseling|hostel accommodation/i);
  if (idx >= 0) {
    const prepChunk = prepared.slice(idx, idx + 2500);
    console.log('\n--- PREPARED snippet ---');
    console.log(prepChunk.slice(0, 2000));
  }
}
