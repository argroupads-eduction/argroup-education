/**
 * Parse WordPress MySQL dump fragments (wp_posts, wp_postmeta).
 * Handles INSERT ... VALUES (...), (...); with quoted strings and escapes.
 */

import { isYoastMetaKey } from './yoast-meta-keys.mjs';

/**
 * @param {string} sql
 * @param {string} tableName e.g. wp_postmeta
 * @returns {string[]}
 */
function extractInsertBlocks(sql, tableName) {
  const blocks = [];
  const pattern = new RegExp(
    `INSERT\\s+INTO\\s+\`?${tableName}\`?\\s*(?:\\([^)]+\\))?\\s*VALUES`,
    'gi'
  );
  let match;
  while ((match = pattern.exec(sql)) !== null) {
    const valuesStart = match.index + match[0].length;
    const end = findInsertStatementEnd(sql, valuesStart);
    blocks.push(sql.slice(valuesStart, end));
  }
  return blocks;
}

function findInsertStatementEnd(sql, start) {
  let i = start;
  let depth = 0;
  let inString = false;
  let escape = false;

  while (i < sql.length) {
    const ch = sql[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === "'") {
        if (sql[i + 1] === "'") {
          i += 1;
        } else {
          inString = false;
        }
      }
      i += 1;
      continue;
    }

    if (ch === "'") {
      inString = true;
      i += 1;
      continue;
    }

    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;

    if (depth === 0 && ch === ';') {
      return i;
    }
    i += 1;
  }

  return sql.length;
}

/**
 * @param {string} valuesSection
 * @returns {unknown[][]}
 */
function parseValueTuples(valuesSection) {
  const tuples = [];
  let i = 0;

  while (i < valuesSection.length) {
    while (i < valuesSection.length && /[\s,]/.test(valuesSection[i])) i += 1;
    if (i >= valuesSection.length) break;
    if (valuesSection[i] !== '(') {
      i += 1;
      continue;
    }

    const tuple = parseTuple(valuesSection, i);
    tuples.push(tuple.fields);
    i = tuple.end;
  }

  return tuples;
}

function parseTuple(s, start) {
  const fields = [];
  let i = start + 1;

  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i += 1;
    if (s[i] === ')') {
      return { fields, end: i + 1 };
    }

    const field = parseField(s, i);
    fields.push(field.value);
    i = field.end;

    while (i < s.length && /\s/.test(s[i])) i += 1;
    if (s[i] === ',') i += 1;
  }

  return { fields, end: i };
}

function parseField(s, start) {
  if (s[start] === "'") {
    return parseQuotedString(s, start);
  }

  const nullMatch = s.slice(start, start + 4).toUpperCase();
  if (nullMatch === 'NULL') {
    return { value: null, end: start + 4 };
  }

  let i = start;
  while (i < s.length && /[0-9.eE+-]/.test(s[i])) i += 1;
  const raw = s.slice(start, i).trim();
  if (!raw) {
    return { value: null, end: start + 1 };
  }
  const num = Number(raw);
  return { value: Number.isFinite(num) ? num : raw, end: i };
}

function parseQuotedString(s, start) {
  let i = start + 1;
  let value = '';

  while (i < s.length) {
    const ch = s[i];
    if (ch === '\\' && i + 1 < s.length) {
      value += s[i + 1];
      i += 2;
      continue;
    }
    if (ch === "'") {
      if (s[i + 1] === "'") {
        value += "'";
        i += 2;
        continue;
      }
      return { value, end: i + 1 };
    }
    value += ch;
    i += 1;
  }

  return { value, end: i };
}

/**
 * @param {unknown[][]} tuples
 * @param {string[]} columnOrder
 */
function mapTuplesToRows(tuples, columnOrder) {
  return tuples.map((fields) => {
    const row = {};
    for (let i = 0; i < columnOrder.length; i += 1) {
      row[columnOrder[i]] = fields[i] ?? null;
    }
    return row;
  });
}

/**
 * Detect column order from INSERT header or default WordPress schema.
 * @param {string} sql
 * @param {string} tableName
 */
function detectColumns(sql, tableName) {
  const headerRe = new RegExp(
    `INSERT\\s+INTO\\s+\`?${tableName}\`?\\s*\\(([^)]+)\\)\\s*VALUES`,
    'i'
  );
  const match = headerRe.exec(sql);
  if (match) {
    return match[1]
      .split(',')
      .map((c) => c.trim().replace(/`/g, ''));
  }

  if (tableName === 'wp_postmeta') {
    return ['meta_id', 'post_id', 'meta_key', 'meta_value'];
  }
  if (tableName === 'wp_posts') {
    return [
      'ID',
      'post_author',
      'post_date',
      'post_date_gmt',
      'post_content',
      'post_title',
      'post_excerpt',
      'post_status',
      'comment_status',
      'ping_status',
      'post_password',
      'post_name',
      'to_ping',
      'pinged',
      'post_modified',
      'post_modified_gmt',
      'post_content_filtered',
      'post_parent',
      'guid',
      'menu_order',
      'post_type',
      'post_mime_type',
      'comment_count',
    ];
  }

  return [];
}

/**
 * @param {string} sql
 * @param {string} tableName
 * @returns {Record<string, unknown>[]}
 */
export function parseTableInserts(sql, tableName) {
  const columns = detectColumns(sql, tableName);
  if (!columns.length) return [];

  const blocks = extractInsertBlocks(sql, tableName);
  const rows = [];

  for (const block of blocks) {
    const tuples = parseValueTuples(block);
    rows.push(...mapTuplesToRows(tuples, columns));
  }

  return rows;
}

/**
 * @param {string} sql
 * @returns {Map<number, Map<string, string>>} postId -> meta_key -> meta_value
 */
export function parseWpPostmeta(sql) {
  const rows = parseTableInserts(sql, 'wp_postmeta');
  const byPost = new Map();

  for (const row of rows) {
    const postId = Number(row.post_id);
    const metaKey = String(row.meta_key ?? '');
    const metaValue = row.meta_value == null ? '' : String(row.meta_value);

    if (!postId || !isYoastMetaKey(metaKey)) continue;

    if (!byPost.has(postId)) byPost.set(postId, new Map());
    byPost.get(postId).set(metaKey, metaValue);
  }

  return byPost;
}

/**
 * @param {string} sql
 * @returns {Map<number, { id: number, slug: string, type: string, status: string, guid: string | null }>}
 */
export function parseWpPosts(sql) {
  const rows = parseTableInserts(sql, 'wp_posts');
  const byId = new Map();

  for (const row of rows) {
    const id = Number(row.ID);
    if (!id) continue;

    byId.set(id, {
      id,
      slug: String(row.post_name ?? ''),
      type: String(row.post_type ?? ''),
      status: String(row.post_status ?? ''),
      guid: row.guid != null ? String(row.guid) : null,
    });
  }

  return byId;
}

/**
 * @param {string} sql
 * @returns {Map<number, Record<string, unknown>>} object_id → row
 */
export function parseWpYoastIndexable(sql) {
  const rows = parseTableInserts(sql, 'wp_yoast_indexable');
  const byObjectId = new Map();

  for (const row of rows) {
    const objectId = Number(row.object_id);
    if (!objectId) continue;
    byObjectId.set(objectId, row);
  }

  return byObjectId;
}

/**
 * @param {string | null | undefined} raw
 * @returns {string | null}
 */
export function unserializePhpString(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const phpMatch = /^s:\d+:"(.*)";?$/s.exec(trimmed);
  if (phpMatch) {
    return phpMatch[1].replace(/\\"/g, '"');
  }

  return trimmed;
}
