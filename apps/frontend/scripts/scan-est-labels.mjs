import { readFileSync } from 'node:fs';

const pages = JSON.parse(readFileSync('data/wp-export-bundle/pages.json', 'utf8'));
const p = pages.find((x) => x.slug === 'mbbs-in-india');
const labels = new Set();
for (const t of p.content.match(/<table\b[\s\S]*?<\/table>/gi) || []) {
  if (!/eael-data-table/i.test(t)) continue;
  for (const row of (t.match(/<tbody[\s\S]*?<\/tbody>/i)?.[0] || '').matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)];
    if (cells.length < 1) continue;
    const label = cells[0][0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (/establish/i.test(label)) labels.add(label);
  }
}
console.log([...labels]);
