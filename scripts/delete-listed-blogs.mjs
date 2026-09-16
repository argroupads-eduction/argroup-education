/**
 * Delete listed blogs from Payload (cms.posts), mark BlogPost unpublished,
 * and strip them from the WP export bundle so they cannot reappear on the frontend.
 * Does NOT push / commit.
 *
 * Usage: node scripts/delete-listed-blogs.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DELETE_BLOG_SLUGS } from './delete-blog-slugs-list.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const postsPath = path.join(root, 'apps/frontend/data/wp-export-bundle/posts.json');
const blogUtilsPath = path.join(root, 'apps/frontend/lib/blogUtils.ts');

const uniqueSlugs = [...new Set(DELETE_BLOG_SLUGS.map((s) => s.trim()).filter(Boolean))];

console.log(`Unique slugs to delete: ${uniqueSlugs.length}`);

// 1) Strip from static WP export bundle
const posts = JSON.parse(await readFile(postsPath, 'utf8'));
const before = posts.length;
const remaining = posts.filter((p) => !uniqueSlugs.includes(p.slug));
const removedFromBundle = before - remaining.length;
await writeFile(postsPath, `${JSON.stringify(remaining, null, 2)}\n`, 'utf8');
console.log(`Bundle: removed ${removedFromBundle} of ${before} (left ${remaining.length})`);

// 2) Extend BLOG_EXCLUDED_LIST_SLUGS in blogUtils.ts
let blogUtils = await readFile(blogUtilsPath, 'utf8');
const marker = 'export const BLOG_EXCLUDED_LIST_SLUGS = new Set([';
const start = blogUtils.indexOf(marker);
if (start < 0) throw new Error('BLOG_EXCLUDED_LIST_SLUGS not found');
const openBracket = blogUtils.indexOf('[', start);
const closeBracket = blogUtils.indexOf(']);', openBracket);
if (openBracket < 0 || closeBracket < 0) throw new Error('Could not parse BLOG_EXCLUDED_LIST_SLUGS');

const existingBlock = blogUtils.slice(openBracket + 1, closeBracket);
const existing = new Set(
  [...existingBlock.matchAll(/'([^']+)'/g)].map((m) => m[1])
);
for (const slug of uniqueSlugs) existing.add(slug);
const sorted = [...existing].sort((a, b) => a.localeCompare(b));
const nextBlock = `\n${sorted.map((s) => `  '${s}',`).join('\n')}\n`;
blogUtils = `${blogUtils.slice(0, openBracket + 1)}${nextBlock}${blogUtils.slice(closeBracket)}`;
await writeFile(blogUtilsPath, blogUtils, 'utf8');
console.log(`Excluded list now has ${sorted.length} slugs`);

// 3) Print SQL for Supabase (run via MCP / SQL editor)
const sqlList = uniqueSlugs.map((s) => `'${s.replace(/'/g, "''")}'`).join(',\n  ');
const sql = `
-- Unpublish / remove from Payload CMS
UPDATE cms.posts
SET _status = 'draft', updated_at = NOW()
WHERE slug IN (
  ${sqlList}
);

-- Keep unpublished BlogPost rows so bundle fallback stays suppressed
UPDATE public."BlogPost"
SET published = false, "updatedAt" = NOW()
WHERE slug IN (
  ${sqlList}
);

-- Report
SELECT 'cms_drafted' AS kind, count(*)::int AS n
FROM cms.posts WHERE slug IN (${sqlList}) AND _status = 'draft'
UNION ALL
SELECT 'blogpost_unpublished', count(*)::int
FROM public."BlogPost" WHERE slug IN (${sqlList}) AND published = false;
`.trim();

const sqlPath = path.join(root, 'scripts/delete-listed-blogs.sql');
await writeFile(sqlPath, `${sql}\n`, 'utf8');
console.log(`Wrote SQL: ${sqlPath}`);
console.log('Next: apply SQL against Supabase (cms.posts + BlogPost). Do not push until asked.');
