import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractContentImages, pickCollegePageImage, scoreCollegeImage } from '../../../scripts/lib/college-image-quality.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = JSON.parse(readFileSync(path.join(ROOT, 'data/wp-export-bundle/pages.json'), 'utf8'));
const tree = JSON.parse(readFileSync(path.join(ROOT, 'data/mbbs-india-tree.json'), 'utf8'));

const targets = [
  'rmc-hospital-and-research-centre',
  'muzaffarnagar-medical-college-mmc-muzaffarnagar',
  'ajay-sangaal-institute-of-medical-sciences',
  'dr-bs-kushwah-institute-of-medical-sciences',
  'kmc-medical-college',
  'hind-institute-of-medical-sciences-lucknow',
  'noida-international-institute-of-medical-sciences',
];

for (const slug of targets) {
  const p = pages.find((x) => x.slug === slug);
  console.log('\n===', slug, '===');
  if (!p) {
    console.log('NO PAGE');
    continue;
  }
  const imgs = extractContentImages(p.content);
  console.log('featured:', p.featuredImage);
  console.log('picked:', pickCollegePageImage(slug, p.featuredImage, p.content));
  for (const u of imgs.slice(0, 8)) {
    console.log(' ', scoreCollegeImage(u, slug), u.split('/').pop());
  }
}

let nullCount = 0;
for (const s of tree.states) {
  for (const c of s.colleges) if (!c.image) nullCount++;
}
console.log('\nTree null images:', nullCount);
