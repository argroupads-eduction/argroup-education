import { readFileSync } from 'node:fs';

const slug = process.argv[2] ?? 'noida-international-institute-of-medical-sciences';
const page = JSON.parse(readFileSync('data/wp-export-bundle/pages.json', 'utf8')).find((p) => p.slug === slug);
if (!page) {
  console.log('page not found');
  process.exit(1);
}

console.log('featured:', page.featuredImage);
const imgs = [...page.content.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map((m) => m[1]);
for (const [i, u] of imgs.entries()) {
  console.log(i, u.replace(/^https?:\/\/[^/]+/, ''));
}
