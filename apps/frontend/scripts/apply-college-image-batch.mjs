/**
 * Copy asset images → public/wp-content/uploads/colleges/{slug}.png
 * and set image path in mbbs-india-tree.json / mbbs-abroad-tree.json
 *
 * Usage: node scripts/apply-college-image-batch.mjs
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ASSETS =
  process.env.COLLEGE_IMAGE_ASSETS ||
  path.join(
    process.env.USERPROFILE || process.env.HOME || '',
    '.cursor',
    'projects',
    'c-Users-akash-OneDrive-Desktop-ARGROUP-OF-EDUCTION',
    'assets'
  );
const DEST = path.join(ROOT, 'public', 'wp-content', 'uploads', 'colleges');

/** Slugs that already have local images — never overwrite */
const ALREADY_MAPPED = new Set([
  'al-farabi-kazakh-national-university-kazakhstan',
  'altai-state-university-russia',
  'astana-medical-university-kazakhstan',
  'belgorod-state-university-russia',
  'bharati-vidyapeeth-medical-college-pune',
  'chuvash-state-medical-university-russia',
  'datta-meghe-medical-college-nagpur',
  'dy-patil-medical-college-pune',
  'eras-lucknow-medical-college-lucknow',
  'first-moscow-state-medical-university',
  'first-tashkent-state-medical-institute',
  'kabardino-balkarian-state-university',
  'karaganda-state-medical-university-kazakhstan',
  'kazakh-national-medical-university',
  'kazan-federal-medical-university-russia',
  'kazan-state-medical-university-russia',
  'kemerovo-state-medical-university-russia',
  'kursk-state-medical-university-russia',
  'mgm-medical-college',
  'muzaffarnagar-medical-college-mmc-muzaffarnagar',
  'north-caucasian-state-academy-russia',
  'omsk-state-medical-university',
  'peoples-friendship-university-russia',
  'pravara-institute-of-medical-sciences-loni',
  'pskov-state-medical-university-russia',
  'saint-petersburg-state-medical-university-russia',
  'samara-state-medical-university',
  'shri-gorakhnath-medical-college',
  'siberian-state-medical-university-russia',
  'smolensk-state-medical-university',
  'south-kazakhstan-medical-academy-kazakhstan',
  'subharti-medical-college',
  'tula-state-medical-university',
  'voronezh-state-medical-university',
  'yaroslav-the-wise-novgorod-state-medical-university',
]);

/** source filename fragment → college slug */
const BATCH = [
  // Batch 3 — Chhattisgarh, Bihar, Nepal, Kyrgyzstan
  ['Raipur_Institute_of_Medical_Sciences__Chhattisgarh', 'raipur-institute-of-medical-sciences'],
  ['Shree_Shankaracharya_Institute_of_Medical_Sciences', 'shree-shankaracharya-institute-of-medical-sciences'],
  ['SHRI_BALAJI_INSTITUTE_OF_MEDICAL_SCIENCE', 'shri-balaji-institute-of-medical-sciences-raipur'],
  ['Katihar_Medical_College_Hospital__Bihar', 'katihar-medical-college-bihar'],
  ['Madhubani_Medical_College___Hospital__Bihar', 'madhubani-medical-college-hospital-bihar'],
  [
    'Mata_Gujri_Memorial_Medical_College__Kishanganj',
    'mata-gujri-memorial-medical-college-lions-seva-kendra-hospital-kishanganj-bihar',
  ],
  ['Narayan_Medical_College___Hospital__Bihar', 'narayan-medical-college-hospital-bihar'],
  ['Netaji_Subhas_Medical_College___Hospital__Bihta__Patna', 'netaji-subhas-medical-college-hospital'],
  [
    'Radha_Devi_Jageshwari_Memorial_Medical_College_and_Hospital__Muzaffarpur',
    'radha-devi-jageshwari-memorial-medical-college-and-hospital-muzaffarpur',
  ],
  ['Shree_Narayan_Medical_Institute_and_Hospital__Saharsa', 'shree-narayan-medical-institute-hospital-saharsa'],
  ['College_of_Medical_Science_Nepal', 'college-of-medical-science-bharatpur'],
  ['Devdaha_Medical_College_and_Research_Institute__Nepal', 'devdaha-medical-college-and-research-institute'],
  ['Gandaki_Medical_College__Nepal', 'gandaki-medical-college-pokhara'],
  ['KIST_Medical_College__Nepal', 'kist-medical-college-kathmandu'],
  ['Kathmandu_Medical_College__Nepal', 'kathmandu-medical-college'],
  ['Lumbini_Medical_College', 'lumbini-medical-college-palpa'],
  ['Manipal_Pokhara_College_of_Medical_Science__Nepal', 'manipal-college-of-medical-science'],
  ['national_medical_college__Nepal', 'national-medical-college-nepal'],
  ['Nepal_Medical_College__Nepal', 'nepal-medical-college-jorpati-kathmandu'],
  ['Nobel_Medical_College__Nepal', 'nobel-medical-college-nepal'],
  ['Universal_College_of_Medical_Sciences__Nepal', 'universal-medical-college-bhairahawa'],
  ['birat_medical_college__Nepal', 'birat-medical-college-biratnagar'],
  ['Chitwan_Medical_College__Nepal', 'chitwan-medical-college-bharatpur'],
  ['images_1-c215d86f-e141', 'nepalgunj-medical-college'],
  ['images_5-d96ece21-f91b', 'international-school-of-medicine-kyrgyzstan'],
  ['images_6-2e014ef5-1ec3', 'asian-medical-institute-kyrgyzstan'],
  ['images_7-dd78722f-a91e', 'osh-state-medical-university-kyrgyzstan'],
  ['images_8-ba093e90-aca1', 'jalal-abad-international-university'],
  ['images_9-7f699abb-7d9c', 'jalal-abad-state-university-kyrgyzstan'],
  // Batch 2 (historical)
  ['Subharti_Medical_College__Meerut', 'subharti-medical-college'],
  ['Era_s_Lucknow_Medical_College__Lucknow', 'eras-lucknow-medical-college-lucknow'],
  ['Pravara_Institute_of_Medical_Sciences__Loni', 'pravara-institute-of-medical-sciences-loni'],
  ['images_10-edce3d22-694e', 'shri-gorakhnath-medical-college'],
  ['Muzaffarnagar_Medical_College__Muzaffarnagar', 'muzaffarnagar-medical-college-mmc-muzaffarnagar'],
  ['Kabardino_Balkarian_State_University__Russia__2_', 'kabardino-balkarian-state-university'],
  ['Chuvash_State_Medical_University___Russia', 'chuvash-state-medical-university-russia'],
  ['Belgorod_State_University__Russia', 'belgorod-state-university-russia'],
  ['first_moscow_state_medical_university_russia', 'first-moscow-state-medical-university'],
  ['Kazan_Federal_University__Russia', 'kazan-federal-medical-university-russia'],
  ['Altai_State_University__Russia', 'altai-state-university-russia'],
  ['Kemerovo_State_Medical_University__Russia', 'kemerovo-state-medical-university-russia'],
  ['Kursk_State_Medical_University__Russia', 'kursk-state-medical-university-russia'],
  ['North_Caucasian_State_Academy__Russia-3c0365c0', 'north-caucasian-state-academy-russia'],
  ['Kazan_State_Medical_University__Russia', 'kazan-state-medical-university-russia'],
  ['omsk_state_medical_university__Russia', 'omsk-state-medical-university'],
  ['Peoples_Friendship_University__Russia', 'peoples-friendship-university-russia'],
  ['Samara_State_Medical_University__Russia', 'samara-state-medical-university'],
  ['Pskov_State_Medical_University__Russia', 'pskov-state-medical-university-russia'],
  ['Saint_Petersburg_State_Medical_University_Russia', 'saint-petersburg-state-medical-university-russia'],
  ['Siberian_State_Medical_University__Russia', 'siberian-state-medical-university-russia'],
  ['Tula_State_Medical_University__Russia-a7e50c02', 'tula-state-medical-university'],
  ['Tashkent_Medical_Academy', 'first-tashkent-state-medical-institute'],
  ['Smolensk_State_Medical_University__Russia', 'smolensk-state-medical-university'],
  ['Voronezh_State_Medical_University__Russia', 'voronezh-state-medical-university'],
  ['Yaroslav-the-wise_Novgorod_State_Medical_University__Russia', 'yaroslav-the-wise-novgorod-state-medical-university'],
];

function findAsset(fragment) {
  const files = readdirSafe(ASSETS);
  const hit = files.find((f) => f.includes(fragment));
  return hit ? path.join(ASSETS, hit) : null;
}

function readdirSafe(dir) {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
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

for (const [fragment, slug] of BATCH) {
  if (ALREADY_MAPPED.has(slug)) {
    console.log('SKIP (already mapped)', slug);
    continue;
  }
  const src = findAsset(fragment);
  if (!src) {
    console.warn('MISSING asset for', slug, `(fragment: ${fragment})`);
    missing++;
    continue;
  }
  const destFile = path.join(DEST, `${slug}.png`);
  copyFileSync(src, destFile);
  imagePathBySlug.set(slug, `/wp-content/uploads/colleges/${slug}.png`);
  copied++;
  console.log('OK', slug);
}

for (const file of ['data/mbbs-india-tree.json', 'data/mbbs-abroad-tree.json']) {
  const full = path.join(ROOT, file);
  const data = JSON.parse(readFileSync(full, 'utf8'));
  let updates = 0;
  for (const [slug, imagePath] of imagePathBySlug) {
    updates += updateCollegeImages(data, slug, imagePath);
  }
  writeFileSync(full, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Updated ${updates} entries in ${file}`);
}

console.log(`\nDone: ${copied} copied, ${missing} missing assets.`);
