import { readFileSync } from 'node:fs';

const slug = process.argv[2] ?? 'mbbs-in-india';
const needle = process.argv[3] ?? 'Noida International';
const page = JSON.parse(readFileSync('data/wp-export-bundle/pages.json', 'utf8')).find((p) => p.slug === slug);
const idx = page.content.indexOf(needle);
if (idx < 0) {
  console.log('not found in', slug);
  process.exit(0);
}
const slice = page.content.slice(Math.max(0, idx - 500), idx + 4000);
const imgs = [...slice.matchAll(/src=["']([^"']+)["']/gi)].map((m) => m[1]);
console.log('href', slice.match(/href=["']([^"']+)["']/i)?.[1]);
imgs.forEach((u) => console.log(u.replace(/^https?:\/\/[^/]+/, '')));
