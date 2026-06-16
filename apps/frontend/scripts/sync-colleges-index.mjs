#!/usr/bin/env node
/** Prefer bundled public/wp-content/uploads/colleges/{slug}.* in college-image-index.json */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const COLLEGES_DIR = path.join(ROOT, 'public', 'wp-content', 'uploads', 'colleges');
const INDEX_PATH = path.join(ROOT, 'data', 'college-image-index.json');

const index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
const bySlug = index.bySlug || {};

if (!existsSync(COLLEGES_DIR)) {
  console.log('No colleges dir');
  process.exit(0);
}

const byBase = new Map();
for (const name of readdirSync(COLLEGES_DIR)) {
  const m = name.match(/^(.+)\.(jpe?g|png|webp|gif|avif)$/i);
  if (!m) continue;
  const slug = m[1];
  const ext = m[2].toLowerCase();
  const score = ext === 'png' ? 1 : ext === 'jpg' || ext === 'jpeg' ? 3 : 2;
  const prev = byBase.get(slug);
  if (!prev || score > prev.score) byBase.set(slug, { name, score });
}

let updated = 0;
// Prefer JPG/WEBP in index when both exist; do not delete bundled PNG campus photos.
for (const [slug, { name }] of byBase) {
  const rel = `/wp-content/uploads/colleges/${name}`;
  if (bySlug[slug] !== rel) {
    bySlug[slug] = rel;
    updated++;
  }
}

index.bySlug = bySlug;
index.count = Object.keys(bySlug).length;
index.generatedAt = new Date().toISOString();
writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
console.log(`Synced ${updated} index entries from colleges/ (${byBase.size} local files)`);
