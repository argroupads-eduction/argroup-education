/**
 * STEP 3 ONLY — read Hostinger MySQL *backup dump* → JSON.
 * NEVER connects to live DATABASE_URL. Never writes MySQL.
 *
 * Usage:
 *   node scripts/strapi-export-from-mysql-dump.mjs
 *   node scripts/strapi-export-from-mysql-dump.mjs --limit=5
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dumpPath = path.join(
  root,
  'backups/pre-strapi-migration-2026-09-18/mysql/hostinger-argroup-full.sql'
);
const outDir = path.join(
  root,
  'backups/pre-strapi-migration-2026-09-18/strapi-seed'
);

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 0;

function parseArgsList(s) {
  // Very small MySQL VALUES tokenizer for dump produced by our backup script
  const args = [];
  let i = 0;
  while (i < s.length) {
    while (i < s.length && (s[i] === ' ' || s[i] === '\n' || s[i] === '\r' || s[i] === '\t')) i++;
    if (i >= s.length) break;
    if (s[i] === ',') {
      i++;
      continue;
    }
    if (s.slice(i, i + 4).toUpperCase() === 'NULL' && (i + 4 >= s.length || /[\s,]/.test(s[i + 4] || ''))) {
      args.push(null);
      i += 4;
      continue;
    }
    if (s[i] === "'") {
      i++;
      let out = '';
      while (i < s.length) {
        if (s[i] === '\\') {
          const n = s[i + 1];
          if (n === 'n') out += '\n';
          else if (n === 'r') out += '\r';
          else if (n === 't') out += '\t';
          else if (n === '0') out += '\0';
          else if (n === 'Z') out += '\x1a';
          else out += n;
          i += 2;
          continue;
        }
        if (s[i] === "'" && s[i + 1] === "'") {
          out += "'";
          i += 2;
          continue;
        }
        if (s[i] === "'") {
          i++;
          break;
        }
        out += s[i++];
      }
      args.push(out);
      continue;
    }
    // number / bare
    let j = i;
    while (j < s.length && s[j] !== ',' && s[j] !== ')') j++;
    const raw = s.slice(i, j).trim();
    if (raw === '') {
      i = j;
      continue;
    }
    if (/^-?\d+(\.\d+)?$/.test(raw)) args.push(Number(raw));
    else args.push(raw);
    i = j;
  }
  return args;
}

function extractInserts(sql, table) {
  const needle = `INSERT INTO \`${table}\``;
  const rows = [];
  let idx = 0;
  while (true) {
    const start = sql.indexOf(needle, idx);
    if (start < 0) break;
    const valuesAt = sql.indexOf('VALUES', start);
    if (valuesAt < 0) break;
    let i = valuesAt + 6;
    while (i < sql.length) {
      while (i < sql.length && /\s/.test(sql[i])) i++;
      if (sql[i] !== '(') break;
      let depth = 0;
      let inStr = false;
      let j = i;
      for (; j < sql.length; j++) {
        const c = sql[j];
        if (inStr) {
          if (c === '\\') {
            j++;
            continue;
          }
          if (c === "'") {
            if (sql[j + 1] === "'") {
              j++;
              continue;
            }
            inStr = false;
          }
          continue;
        }
        if (c === "'") {
          inStr = true;
          continue;
        }
        if (c === '(') depth++;
        else if (c === ')') {
          depth--;
          if (depth === 0) {
            j++;
            break;
          }
        }
      }
      const tuple = sql.slice(i + 1, j - 1);
      rows.push(parseArgsList(tuple));
      i = j;
      while (i < sql.length && /\s/.test(sql[i])) i++;
      if (sql[i] === ',') {
        i++;
        continue;
      }
      if (sql[i] === ';') {
        i++;
        break;
      }
      break;
    }
    idx = i;
    if (LIMIT && rows.length >= LIMIT) break;
  }
  return LIMIT ? rows.slice(0, LIMIT) : rows;
}

function mapBlog(row) {
  // Column order from CREATE TABLE BlogPost in dump
  const [
    id,
    wpId,
    title,
    slug,
    content,
    excerpt,
    featuredImage,
    category,
    tags,
    metaTitle,
    metaDescription,
    canonicalUrl,
    focusKeyword,
    keywords,
    ogTitle,
    ogDescription,
    ogImage,
    twitterTitle,
    twitterDescription,
    schemaJson,
    author,
    published,
    publishedAt,
    views,
    createdAt,
    updatedAt,
  ] = row;

  const parseJson = (v, fallback) => {
    if (v == null || v === '') return fallback;
    try {
      return typeof v === 'string' ? JSON.parse(v) : v;
    } catch {
      return fallback;
    }
  };

  return {
    mysqlId: id,
    wpId: wpId ?? null,
    title: title || '',
    slug: slug || '',
    content: content || '',
    excerpt: excerpt || '',
    featuredImage: featuredImage || null,
    category: category || 'Blog',
    tags: parseJson(tags, []),
    metaTitle: metaTitle || null,
    metaDescription: metaDescription || null,
    canonicalUrl: canonicalUrl || null,
    focusKeyword: focusKeyword || null,
    keywords: parseJson(keywords, []),
    ogTitle: ogTitle || null,
    ogDescription: ogDescription || null,
    ogImage: ogImage || null,
    twitterTitle: twitterTitle || null,
    twitterDescription: twitterDescription || null,
    schemaJson: parseJson(schemaJson, null),
    author: author || 'AR Group',
    published: published === 1 || published === true,
    publishedAt: publishedAt || null,
    views: typeof views === 'number' ? views : 0,
    createdAt: createdAt || null,
    updatedAt: updatedAt || null,
  };
}

function mapPage(row) {
  const [
    id,
    wpId,
    title,
    slug,
    content,
    excerpt,
    featuredImage,
    metaTitle,
    metaDescription,
    canonicalUrl,
    focusKeyword,
    keywords,
    ogTitle,
    ogDescription,
    ogImage,
    twitterTitle,
    twitterDescription,
    schemaJson,
    navEnabled,
    navSection,
    navParent,
    navLabel,
    navSortOrder,
    published,
    publishedAt,
    createdAt,
    updatedAt,
  ] = row;

  const parseJson = (v, fallback) => {
    if (v == null || v === '') return fallback;
    try {
      return typeof v === 'string' ? JSON.parse(v) : v;
    } catch {
      return fallback;
    }
  };

  return {
    mysqlId: id,
    wpId: wpId ?? null,
    title: title || '',
    slug: slug || '',
    content: content || '',
    excerpt: excerpt || null,
    featuredImage: featuredImage || null,
    metaTitle: metaTitle || null,
    metaDescription: metaDescription || null,
    canonicalUrl: canonicalUrl || null,
    focusKeyword: focusKeyword || null,
    keywords: parseJson(keywords, []),
    ogTitle: ogTitle || null,
    ogDescription: ogDescription || null,
    ogImage: ogImage || null,
    twitterTitle: twitterTitle || null,
    twitterDescription: twitterDescription || null,
    schemaJson: parseJson(schemaJson, null),
    navEnabled: navEnabled === 1 || navEnabled === true,
    navSection: navSection || null,
    navParent: navParent || null,
    navLabel: navLabel || null,
    navSortOrder: typeof navSortOrder === 'number' ? navSortOrder : 0,
    published: published === 1 || published === true,
    publishedAt: publishedAt || null,
    createdAt: createdAt || null,
    updatedAt: updatedAt || null,
  };
}

if (!fs.existsSync(dumpPath)) {
  console.error('Dump not found:', dumpPath);
  process.exit(1);
}

console.log('[strapi-export] reading dump (read-only file)...');
const sql = fs.readFileSync(dumpPath, 'utf8');
const blogRows = extractInserts(sql, 'BlogPost').map(mapBlog);
const pageRows = extractInserts(sql, 'SitePage').map(mapPage);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'posts.json'), JSON.stringify(blogRows, null, 0));
fs.writeFileSync(path.join(outDir, 'pages.json'), JSON.stringify(pageRows, null, 0));
fs.writeFileSync(
  path.join(outDir, 'manifest.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: 'backups/pre-strapi-migration-2026-09-18/mysql/hostinger-argroup-full.sql',
      liveWrite: false,
      posts: blogRows.length,
      pages: pageRows.length,
      limit: LIMIT || null,
    },
    null,
    2
  )
);

console.log('[strapi-export] posts=', blogRows.length, 'pages=', pageRows.length);
console.log('[strapi-export] wrote', outDir);
