/**
 * Apply Haryana college campus photos from Cursor workspaceStorage.
 * Usage: node scripts/apply-haryana-images.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'public', 'wp-content', 'uploads', 'colleges');

const SOURCE = path.join(
  process.env.USERPROFILE || '',
  'AppData',
  'Roaming',
  'Cursor',
  'User',
  'workspaceStorage',
  'eed535d247bf1647b858f6dd47f5c2e5',
  'images'
);

/** source filename prefix → college slug */
const HARYANA = [
  ['Manav Rachna Dental College-', 'manav-rachna-dental-college'],
  ['Adesh Medical College-', 'adesh-medical-college-and-hospital-kurukshetra'],
  ['Al-falah School of Medical Sciences', 'al-falah-school-of-medical-sciences-research-centre'],
  ['SGT Medical College-', 'sgt-medical-college-gurugram'],
  ['World College of Medical Science and Research-', 'world-college-of-medical-science-jhajjar'],
  ['RPS College of Veterinary', 'rps-college-of-veterinary-sciences'],
  ['NC Medical College and Hospital-', 'nc-medical-college-and-hospital-panipat'],
  ['Maharishi Markandeshwar Medical College-', 'maharishi-markandeshwar-medical-college-ambala'],
  ['Amrita Medical College-', 'amrita-medical-college-faridabad'],
];

function findSource(prefix) {
  if (!existsSync(SOURCE)) return null;
  const hit = readdirSync(SOURCE).find((f) => f.includes(prefix) && f.endsWith('.png'));
  return hit ? path.join(SOURCE, hit) : null;
}

function updateCollegeImages(obj, slug, imagePath) {
  let n = 0;
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node.slug === slug) {
      node.image = imagePath;
      n++;
    }
    Object.values(node).forEach(walk);
  }
  walk(obj);
  return n;
}

mkdirSync(DEST, { recursive: true });

const imagePathBySlug = new Map();
let copied = 0;
let missing = 0;

for (const [prefix, slug] of HARYANA) {
  const src = findSource(prefix);
  if (!src) {
    console.warn('MISSING', slug, `(prefix: ${prefix})`);
    missing++;
    continue;
  }
  const destFile = path.join(DEST, `${slug}.png`);
  copyFileSync(src, destFile);
  imagePathBySlug.set(slug, `/wp-content/uploads/colleges/${slug}.png`);
  copied++;
  console.log('OK', slug);
}

for (const file of ['data/mbbs-india-tree.json']) {
  const full = path.join(ROOT, file);
  const data = JSON.parse(readFileSync(full, 'utf8'));
  let updates = 0;
  for (const [slug, imagePath] of imagePathBySlug) {
    updates += updateCollegeImages(data, slug, imagePath);
  }
  writeFileSync(full, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Updated ${updates} entries in ${file}`);
}

const indexPath = path.join(ROOT, 'data', 'college-image-index.json');
if (existsSync(indexPath)) {
  const indexData = JSON.parse(readFileSync(indexPath, 'utf8'));
  let indexUpdates = 0;
  for (const [slug, imagePath] of imagePathBySlug) {
    if (indexData.bySlug?.[slug] !== imagePath) {
      indexData.bySlug[slug] = imagePath;
      indexUpdates++;
    }
  }
  indexData.generatedAt = new Date().toISOString();
  writeFileSync(indexPath, `${JSON.stringify(indexData, null, 2)}\n`);
  console.log(`Updated ${indexUpdates} entries in college-image-index.json`);
}

console.log(`\nDone: ${copied} copied, ${missing} missing.`);
