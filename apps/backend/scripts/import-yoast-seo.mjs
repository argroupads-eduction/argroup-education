#!/usr/bin/env node
/**
 * Import Yoast SEO only (no content/title/slug/images) from WordPress SQL dump.
 *
 * Sources: wp_yoast_indexable, wp_postmeta (fallback)
 * Match: WordPress object_id (wpId) or slug
 *
 * Usage (from apps/backend):
 *   npm run wp:seo:import
 *   node --env-file=.env scripts/import-yoast-seo.mjs -- path/to/wordpress.sql
 */

import { access, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import {
  parseWpPostmeta,
  parseWpPosts,
  parseWpYoastIndexable,
} from './lib/parse-wp-sql.mjs';
import { yoastSeoOnlyFromPostmeta } from './lib/yoast-from-meta.mjs';
import { mergeIndexableAndMeta } from './lib/yoast-from-indexable.mjs';
import {
  hasAnyYoastSeoField,
  prismaSeoOnlyUpdate,
  slugFromPermalink,
} from './lib/yoast-seo-fields.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const DEFAULT_SQL = path.join(REPO_ROOT, 'data', 'wp-export', 'wordpress.sql');
const REPORT_DIR = path.join(REPO_ROOT, 'data', 'wp-export', 'reports');

const prisma = new PrismaClient();

function resolveSqlPath(argv) {
  const flagIdx = argv.indexOf('--');
  if (flagIdx >= 0 && argv[flagIdx + 1]) {
    return path.resolve(argv[flagIdx + 1]);
  }
  if (process.env.WP_SQL_DUMP) {
    return path.resolve(process.env.WP_SQL_DUMP);
  }
  return DEFAULT_SQL;
}

/** @returns {Promise<string>} */
async function resolveExistingSqlFile(argv) {
  const explicit = resolveSqlPath(argv);
  const candidates = [
    explicit,
    path.join(REPO_ROOT, 'data', 'wp-export', 'wordpress.sql'),
    path.join(REPO_ROOT, 'data', 'wp-export', 'database.sql'),
    path.join(REPO_ROOT, 'wordpress.sql'),
  ];

  const seen = new Set();
  for (const file of candidates) {
    const normalized = path.resolve(file);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    try {
      await access(normalized);
      return normalized;
    } catch {
      /* try next */
    }
  }

  console.error('\nWordPress SQL dump not found.\n');
  console.error('Place your export at one of:');
  for (const file of candidates) {
    console.error(`  - ${file}`);
  }
  console.error('\nOr run:');
  console.error('  npm run wp:seo:import -- path\\to\\your-dump.sql');
  console.error('  WP_SQL_DUMP=path\\to\\dump.sql npm run wp:seo:import\n');
  process.exit(1);
}

/**
 * Build merged SEO map keyed by WordPress object_id + slug index.
 * @param {string} sql
 */
function buildSeoIndex(sql) {
  const indexableByObjectId = parseWpYoastIndexable(sql);
  const postmetaByPost = parseWpPostmeta(sql);
  const postsById = parseWpPosts(sql);

  const seoByObjectId = new Map();
  const seoBySlug = new Map();
  const duplicateSlugsInSql = [];

  const allObjectIds = new Set([
    ...indexableByObjectId.keys(),
    ...postmetaByPost.keys(),
  ]);

  for (const objectId of allObjectIds) {
    const wpPost = postsById.get(objectId);
    const postType = wpPost?.type;
    if (postType && postType !== 'post' && postType !== 'page') continue;

    const indexRow = indexableByObjectId.get(objectId);
    if (indexRow) {
      const subType = String(indexRow.object_sub_type ?? '');
      const objType = String(indexRow.object_type ?? '');
      if (objType === 'post' && subType !== 'post' && subType !== 'page') continue;
    } else if (!wpPost) {
      continue;
    }

    const fromMeta = postmetaByPost.has(objectId)
      ? yoastSeoOnlyFromPostmeta(postmetaByPost.get(objectId), postsById)
      : undefined;

    const merged = mergeIndexableAndMeta(indexRow, fromMeta);
    if (!hasAnyYoastSeoField(merged)) continue;

    seoByObjectId.set(objectId, merged);

    const slug =
      wpPost?.slug ||
      slugFromPermalink(indexRow?.permalink != null ? String(indexRow.permalink) : null);

    if (!slug) continue;

    if (seoBySlug.has(slug)) {
      const prev = seoBySlug.get(slug);
      duplicateSlugsInSql.push({
        slug,
        objectIds: [prev.objectId, objectId],
        source: 'wordpress_sql',
      });
    }

    seoBySlug.set(slug, { ...merged, objectId, postType: postType ?? indexRow?.object_sub_type });
  }

  return { seoByObjectId, seoBySlug, duplicateSlugsInSql, indexableByObjectId, postmetaByPost };
}

/**
 * @param {Array<{ slug: string }>} rows
 */
function findDuplicateSlugsInDb(rows) {
  const bySlug = new Map();
  for (const row of rows) {
    if (!bySlug.has(row.slug)) bySlug.set(row.slug, []);
    bySlug.get(row.slug).push(row);
  }

  const duplicates = [];
  for (const [slug, items] of bySlug) {
    if (items.length > 1) {
      duplicates.push({
        slug,
        count: items.length,
        records: items.map((r) => ({ id: r.id, wpId: r.wpId ?? null })),
        source: 'neon_database',
      });
    }
  }
  return duplicates;
}

/**
 * @param {object} doc DB row
 * @param {Map<number, object>} seoByObjectId
 * @param {Map<string, object>} seoBySlug
 */
function resolveSeoForDoc(doc, seoByObjectId, seoBySlug) {
  if (doc.wpId != null && seoByObjectId.has(doc.wpId)) {
    return { seo: seoByObjectId.get(doc.wpId), matchedBy: 'object_id' };
  }
  if (seoBySlug.has(doc.slug)) {
    const hit = seoBySlug.get(doc.slug);
    return { seo: hit, matchedBy: 'slug' };
  }
  return { seo: null, matchedBy: null };
}

async function main() {
  const sqlPath = await resolveExistingSqlFile(process.argv.slice(2));
  console.log('Yoast SEO-only import');
  console.log('  SQL:', sqlPath);
  console.log('  Tables: wp_yoast_indexable, wp_postmeta');
  console.log('  Will NOT update: content, title, slug, images\n');

  const sql = await readFile(sqlPath, 'utf8');
  const { seoByObjectId, seoBySlug, duplicateSlugsInSql } = buildSeoIndex(sql);

  console.log(`  Indexable + meta objects with SEO: ${seoByObjectId.size}`);
  console.log(`  Slug index entries: ${seoBySlug.size}`);

  const [blogPosts, sitePages] = await Promise.all([
    prisma.blogPost.findMany({
      select: { id: true, wpId: true, slug: true },
    }),
    prisma.sitePage.findMany({
      select: { id: true, wpId: true, slug: true },
    }),
  ]);

  const duplicateSlugs = [
    ...findDuplicateSlugsInDb(blogPosts),
    ...findDuplicateSlugsInDb(sitePages),
    ...duplicateSlugsInSql,
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    sqlFile: sqlPath,
    summary: {
      totalPostsUpdated: 0,
      totalPagesUpdated: 0,
      missingSeoRecords: 0,
      duplicateSlugs: duplicateSlugs.length,
    },
    duplicateSlugs,
    missingSeoRecords: [],
    updatedPosts: [],
    updatedPages: [],
  };

  for (const post of blogPosts) {
    const { seo, matchedBy } = resolveSeoForDoc(post, seoByObjectId, seoBySlug);

    if (!seo || !hasAnyYoastSeoField(seo)) {
      report.missingSeoRecords.push({
        type: 'post',
        dbId: post.id,
        wpId: post.wpId,
        slug: post.slug,
        reason: 'no_seo_in_sql',
      });
      continue;
    }

    const data = prismaSeoOnlyUpdate(seo);
    if (!Object.keys(data).length) {
      report.missingSeoRecords.push({
        type: 'post',
        dbId: post.id,
        wpId: post.wpId,
        slug: post.slug,
        reason: 'empty_seo_payload',
      });
      continue;
    }

    await prisma.blogPost.update({
      where: { id: post.id },
      data,
    });

    report.summary.totalPostsUpdated += 1;
    report.updatedPosts.push({
      dbId: post.id,
      wpId: post.wpId,
      slug: post.slug,
      matchedBy,
      fields: Object.keys(data),
    });
  }

  for (const page of sitePages) {
    const { seo, matchedBy } = resolveSeoForDoc(page, seoByObjectId, seoBySlug);

    if (!seo || !hasAnyYoastSeoField(seo)) {
      report.missingSeoRecords.push({
        type: 'page',
        dbId: page.id,
        wpId: page.wpId,
        slug: page.slug,
        reason: 'no_seo_in_sql',
      });
      continue;
    }

    const data = prismaSeoOnlyUpdate(seo);
    if (!Object.keys(data).length) {
      report.missingSeoRecords.push({
        type: 'page',
        dbId: page.id,
        wpId: page.wpId,
        slug: page.slug,
        reason: 'empty_seo_payload',
      });
      continue;
    }

    await prisma.sitePage.update({
      where: { id: page.id },
      data,
    });

    report.summary.totalPagesUpdated += 1;
    report.updatedPages.push({
      dbId: page.id,
      wpId: page.wpId,
      slug: page.slug,
      matchedBy,
      fields: Object.keys(data),
    });
  }

  for (const [objectId] of seoByObjectId) {
    let slug = null;
    for (const [s, entry] of seoBySlug) {
      if (entry.objectId === objectId) {
        slug = s;
        break;
      }
    }
    const inPosts = blogPosts.some((p) => p.wpId === objectId || (slug && p.slug === slug));
    const inPages = sitePages.some((p) => p.wpId === objectId || (slug && p.slug === slug));
    if (!inPosts && !inPages) {
      report.missingSeoRecords.push({
        type: 'sql_only',
        wpId: objectId,
        slug,
        reason: 'seo_in_sql_not_in_database',
      });
    }
  }

  report.summary.missingSeoRecords = report.missingSeoRecords.length;

  await mkdir(REPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const jsonPath = path.join(REPORT_DIR, `yoast-seo-only-${stamp}.json`);
  const mdPath = path.join(REPORT_DIR, `yoast-seo-only-${stamp}.md`);

  await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  await writeFile(mdPath, formatReportMarkdown(report), 'utf8');

  console.log('\n=== Yoast SEO-only import report ===');
  console.log(`  Total pages updated: ${report.summary.totalPagesUpdated}`);
  console.log(`  Total posts updated: ${report.summary.totalPostsUpdated}`);
  console.log(`  Missing SEO records: ${report.summary.missingSeoRecords}`);
  console.log(`  Duplicate slugs:     ${report.summary.duplicateSlugs}`);
  console.log(`\n  JSON: ${jsonPath}`);
  console.log(`  MD:   ${mdPath}`);
}

function formatReportMarkdown(report) {
  const s = report.summary;
  return `# Yoast SEO-only import report

Generated: ${report.generatedAt}  
SQL: \`${report.sqlFile}\`

## Summary

| Metric | Count |
|--------|------:|
| **Total pages updated** | ${s.totalPagesUpdated} |
| **Total posts updated** | ${s.totalPostsUpdated} |
| **Missing SEO records** | ${s.missingSeoRecords} |
| **Duplicate slugs** | ${s.duplicateSlugs} |

## Duplicate slugs

${report.duplicateSlugs.length ? report.duplicateSlugs.slice(0, 40).map((d) => `- \`${d.slug}\` (${d.source}, ${d.count ?? d.objectIds?.length ?? '?'} entries)`).join('\n') : '_none_'}

## Missing SEO records (sample)

${report.missingSeoRecords.slice(0, 40).map((r) => `- **${r.reason}** — ${r.type} \`${r.slug ?? r.wpId}\``).join('\n') || '_none_'}
${report.missingSeoRecords.length > 40 ? `\n_…${report.missingSeoRecords.length - 40} more in JSON._` : ''}
`;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
