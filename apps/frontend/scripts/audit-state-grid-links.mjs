import { readFileSync } from 'fs';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
const doc = pages.find((p) => p.slug === 'mbbs-in-india');
const links = [...doc.content.matchAll(/href=["']([^"']*mbbs-in-[^"']+)["']/gi)].map((m) => m[1]);
console.log([...new Set(links)].sort());
