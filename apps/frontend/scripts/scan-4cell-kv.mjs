import { readFileSync } from 'node:fs';

function plain(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const pages = JSON.parse(readFileSync('data/wp-export-bundle/pages.json', 'utf8'));
let kv2 = 0;
let real4 = 0;
const kvSamples = [];

for (const page of pages) {
  const tables = page.content?.match(/<table\b[\s\S]*?<\/table>/gi) || [];
  for (const t of tables) {
    if (!/eael-data-table/i.test(t)) continue;
    const tbody = t.match(/<tbody[\s\S]*?<\/tbody>/i)?.[0] || '';
    for (const row of tbody.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)];
      if (cells.length !== 4) continue;
      const texts = cells.map((c) => plain(c[1]));
      const nonEmpty = texts.map((t, i) => (t ? i : -1)).filter((i) => i >= 0);
      if (nonEmpty.length === 2) {
        kv2++;
        if (kvSamples.length < 8) kvSamples.push({ slug: page.slug, texts, nonEmpty });
      } else if (nonEmpty.length >= 3) real4++;
    }
  }
}
console.log({ kv2, real4, kvSamples });
