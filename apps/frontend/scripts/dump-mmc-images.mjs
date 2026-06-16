import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractContentImages } from '../../../scripts/lib/college-image-quality.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = JSON.parse(readFileSync(path.join(ROOT, 'data/wp-export-bundle/pages.json'), 'utf8'));
const p = pages.find((x) => x.slug === 'muzaffarnagar-medical-college-mmc-muzaffarnagar');
for (const u of extractContentImages(p.content)) console.log(u);
