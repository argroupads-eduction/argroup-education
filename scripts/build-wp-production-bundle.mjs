#!/usr/bin/env node
/**
 * Copies WordPress export JSON into apps/frontend for Vercel (git-tracked).
 * Source: data/wp-export/ (local, gitignored). Run after wp:export or before deploy.
 *
 *   node scripts/build-wp-production-bundle.mjs
 */
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SRC = path.join(REPO_ROOT, 'data', 'wp-export');
const DEST = path.join(REPO_ROOT, 'apps', 'frontend', 'data', 'wp-export-bundle');

async function copyIfExists(name) {
  const from = path.join(SRC, name);
  try {
    await stat(from);
  } catch {
    console.warn(`[wp-bundle] skip missing ${from}`);
    return null;
  }
  await copyFile(from, path.join(DEST, name));
  const buf = await readFile(from);
  return { name, bytes: buf.length };
}

async function main() {
  await mkdir(DEST, { recursive: true });

  const copied = [];
  for (const file of ['pages.json', 'posts.json', 'manifest.json']) {
    const info = await copyIfExists(file);
    if (info) copied.push(info);
  }

  if (!copied.length) {
    console.error(
      '[wp-bundle] No files copied. Export WordPress data first:\n  npm run wp:export'
    );
    process.exit(1);
  }

  const mb = copied.reduce((n, f) => n + f.bytes, 0) / 1024 / 1024;
  console.log(`[wp-bundle] Wrote ${DEST}`);
  for (const f of copied) {
    console.log(`  ${f.name}: ${(f.bytes / 1024 / 1024).toFixed(2)} MB`);
  }
  console.log(`[wp-bundle] Total: ${mb.toFixed(2)} MB — commit apps/frontend/data/wp-export-bundle/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
