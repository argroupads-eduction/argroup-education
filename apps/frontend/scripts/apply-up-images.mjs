/**
 * Apply Uttar Pradesh college campus photos from Cursor workspaceStorage.
 * Usage: node scripts/apply-up-images.mjs
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

/** filename fragment → college slug */
const UP = [
  ['RAMA MEDICAL COLLEGE AND HOSPITAL,  KANPUR', 'rmc-hospital-and-research-centre'],
  ['SARASWATI INSTITUTE OF MEDICAL SCIENCES,  HAPUR', 'saraswathi-institute-of-medical-sciences-hapur'],
  ['NATIONAL CAPITAL REGION INSTITUTE OF MEDICAL SCIENCES, MEERUT', 'ncr-institute-of-medical-sciences-meerut'],
  ['SHRI VENKATESHWARA MEDICAL COLLEGE, AMROHA', 'venkateshwara-institute-of-medical-sciences-gajraula'],
  ['SHREE GORAKHNATH MEDICAL COLLEGE HOSPITAL, GORAKHPUR', 'shri-gorakhnath-medical-college'],
  ['MUZAFFARNAGAR MEDICAL COLLEGE, MUZAFFARNAGAR', 'muzaffarnagar-medical-college-mmc-muzaffarnagar'],
  ['FH MEDICAL COLLEGE, AGRA', 'f-h-medical-college-and-hospital-agra'],
  ['SUBHARTI MEDICAL COLLEGE, MEERUT', 'subharti-medical-college'],
  ['K.D MEDICAL COLLEGE AND HOSPITAL, MATHURA', 'k-d-medical-college-hospital-and-research-center-mathura'],
  ['NARAINA MEDICAL COLLEGE & RESEARCH CENTER, KANPUR', 'naraina-medical-college-research-center-nmrc-kanpur'],
  ['AJAY SANGAAL INSTITUTE OF MEDICAL SCIENCES', 'ajay-sangaal-institute-of-medical-sciences'],
  ['DR BS KUSHWAH INSTITUTE OF MEDICAL SCIENCES, KANPUR', 'dr-bs-kushwah-institute-of-medical-sciences'],
  ['PRASAD INSTITUTE OF MEDICAL SCIENCE, LUCKNOW', 'prasad-institute-of-medical-sciences-lucknow'],
  ['KMC MEDICAL COLLEGE AND HOSPITAL, MAHARAJGANJ', 'kmc-medical-college'],
  ['SHREE SIDDHIVINAYAK MEDICAL COLLEGE AND HOSPITAL, SAMBHAL', 'shri-siddhi-vinayak-medical-college'],
  ['RAJSHREE MEDICAL RESEARCH INSTITUTE, BAREILLY', 'rajshree-medical-research-institute-bareilly'],
  ['CAREER INSTITUTE OF MEDICAL SCIENCE, LUCKNOW', 'career-institute-of-medical-sciences-lucknow'],
  ['UNITED INSTITUTE OF MEDICAL SCIENCES, PRAYAGRAJ', 'united-institute-of-medical-sciences-prayagraj'],
  ['HERITAGE INSTITUTE OF MEDICAL SCIENCES, VARANASI', 'heritage-institute-of-medical-sciences-hims-varanasi'],
  ['HIND INSTITUTE OF MEDICAL SCIENCES, SITAPUR', 'hind-institute-of-medical-sciences-lucknow'],
  ['INTEGRAL INSTITUTE OF MEDICAL SCIENCE, LUCKNOW', 'integral-university-lucknow'],
  ['RAMA MEDICAL AND HOSPITAL & RESEARCH CENTER, HAPUR', 'rama-medical-college-hapur'],
  ['SHARDA UNIVERSITY,  GREATER NOIDA', 'sharda-university'],
  ['SHRI RAM MURTI MEDICAL COLLEGE,  BAREILY', 'shri-ram-murti-smarak-institute-of-medical-sciences-bareilly'],
  ['ROHILKHAND MEDICAL COLLEGE AND HOSPITAL,  BAREILY', 'rohilkhand-medical-college-and-hospital-bareilly'],
  ['NOIDA INTERNATIONAL INSTITUTE OF MEDICAL SCIENCE, GREATER NOIDA', 'noida-international-institute-of-medical-sciences'],
  ['T.S MISHRA MEDICAL COLLEGE AND HOSPITAL, LUCKNOW', 'ts-misra-medical-college-hospital-lucknow'],
  ['KRISHNA MOHAN MEDICAL COLLEGE AND HOSPITAL, MATHURA', 'krishna-mohan-medical-college-mathura'],
  ['SKS MEDICAL COLLEGE, MATHURA', 'sks-hospital-medical-college-and-research-centre-mathura'],
  ['TMU TEERTHANKER MAHAVEER MEDICAL COLLEGE, MORADABAD', 'teerthanker-mahaveer-medical-college-moradabad'],
  ['GS MEDICAL COLLEGE, HAPUR', 'gs-medical-college-hapur'],
  ['MAYO INSTITUTE OF MEDICAL SCIENCES, BARABANKI', 'mayo-institute-of-medical-sciences'],
  ['ERA MEDICAL COLLEGE, LUCKNOW', 'eras-lucknow-medical-college-lucknow'],
];

function findSource(fragment) {
  if (!existsSync(SOURCE)) return null;
  const hit = readdirSync(SOURCE).find((f) => f.includes(fragment) && f.endsWith('.png'));
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

for (const [fragment, slug] of UP) {
  const src = findSource(fragment);
  if (!src) {
    console.warn('MISSING', slug, `(fragment: ${fragment})`);
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

const indexPath = path.join(ROOT, 'data/college-image-index.json');
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
