/**
 * One-shot: publish 3 college blogs to live (payload-sync) + optional Strapi.
 * Does not print secrets. Run from repo root.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const tmp = path.join(process.env.TEMP || '/tmp', 'ar-blogs');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function txtToHtml(raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const meta = {};
  const bodyLines = [];
  let inMeta = true;
  for (const line of lines) {
    if (inMeta) {
      const m = line.match(/^(Meta Title|Meta Description|Primary Keyword|Secondary Keywords|External Keyword|Primary Keywords)\s*:\s*(.*)$/i);
      if (m) {
        meta[m[1].toLowerCase()] = m[2].trim();
        continue;
      }
      if (line.trim() === '' && Object.keys(meta).length) continue;
      inMeta = false;
    }
    bodyLines.push(line);
  }

  // Drop leading duplicate title line if present
  while (bodyLines.length && !bodyLines[0].trim()) bodyLines.shift();

  const blocks = [];
  let para = [];
  let tableRows = [];

  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(' ').replace(/\s+/g, ' ').trim();
    para = [];
    if (!text) return;
    if (/^[A-Z0-9].{10,120}\?$/.test(text) || (/^[A-Z]/.test(text) && text.length < 90 && !text.includes('. '))) {
      blocks.push(`<h2>${escapeHtml(text)}</h2>`);
    } else {
      blocks.push(`<p>${escapeHtml(text)}</p>`);
    }
  };

  const flushTable = () => {
    if (tableRows.length < 2) {
      for (const r of tableRows) para.push(r.join(' '));
      tableRows = [];
      return;
    }
    const head = tableRows[0];
    const body = tableRows.slice(1);
    let html = '<table><thead><tr>';
    for (const c of head) html += `<th>${escapeHtml(c)}</th>`;
    html += '</tr></thead><tbody>';
    for (const row of body) {
      html += '<tr>';
      for (const c of row) html += `<td>${escapeHtml(c)}</td>`;
      html += '</tr>';
    }
    html += '</tbody></table>';
    blocks.push(html);
    tableRows = [];
  };

  for (const line of bodyLines) {
    if (line.includes('\t') && line.trim()) {
      flushPara();
      tableRows.push(line.split('\t').map((s) => s.trim()).filter(Boolean));
      continue;
    }
    if (tableRows.length) flushTable();
    if (!line.trim()) {
      flushPara();
      continue;
    }
    if (/^\*\s+/.test(line.trim())) {
      flushPara();
      const items = [];
      // collect consecutive bullets handled in loop — push single for now
      blocks.push(`<ul><li>${escapeHtml(line.trim().replace(/^\*\s+/, ''))}</li></ul>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line.trim())) {
      flushPara();
      blocks.push(`<ol><li>${escapeHtml(line.trim().replace(/^\d+\.\s+/, ''))}</li></ol>`);
      continue;
    }
    para.push(line.trim());
  }
  if (tableRows.length) flushTable();
  flushPara();

  // Merge adjacent ul/ol
  let html = blocks.join('\n');
  html = html.replace(/<\/ul>\n<ul>/g, '').replace(/<\/ol>\n<ol>/g, '');
  return { meta, html };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const posts = [
  {
    file: 'mamc.txt',
    slug: 'neet-marks-required-for-maulana-azad-medical-college',
    title: 'NEET Marks Required for Maulana Azad Medical College (MAMC) 2026',
    image: '/images/blog/neet-marks-mamc-2026.webp',
    publishedAt: '2026-08-17T10:00:00.000Z',
  },
  {
    file: 'kasturba.txt',
    slug: 'how-much-neet-score-is-required-for-kasturba-medical-college',
    title: 'How Much NEET Score Is Required for Kasturba Medical College?',
    image: '/images/blog/neet-score-kasturba-medical-college.webp',
    publishedAt: '2026-08-18T10:00:00.000Z',
  },
  {
    file: 'amrita.txt',
    slug: 'neet-cut-off-for-mbbs-at-amrita-institute-of-medical-sciences-kochi',
    title: 'What Is the NEET Cut Off for MBBS at Amrita Institute of Medical Sciences Kochi?',
    image: '/images/blog/neet-cutoff-amrita-kochi.webp',
    publishedAt: '2026-08-19T10:00:00.000Z',
  },
];

const feEnv = loadEnvFile(path.join(root, 'apps/frontend/.env.local'));
const secret = feEnv.PAYLOAD_SYNC_SECRET || feEnv.REVALIDATE_SECRET;
if (!secret) {
  console.error('Missing PAYLOAD_SYNC_SECRET in apps/frontend/.env.local');
  process.exit(1);
}

const site = 'https://www.argroupofeducation.com';

async function syncPost(payload) {
  const res = await fetch(`${site}/api/cms/payload-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { status: res.status, json };
}

// Delete probe if any
await syncPost({
  type: 'post',
  slug: '__sync_probe_delete_me__',
  title: 'probe',
  content: '<p>x</p>',
  published: false,
  notifyPush: false,
});

const outSeed = [];

for (const p of posts) {
  const raw = fs.readFileSync(path.join(tmp, p.file), 'utf8');
  const { meta, html } = txtToHtml(raw);
  const featuredImage = `${site}${p.image}`;
  const metaTitle = meta['meta title'] || p.title;
  const metaDescription = meta['meta description'] || '';
  const focusKeyword = meta['primary keyword'] || meta['primary keywords'] || '';
  const secondary = (meta['secondary keywords'] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const excerpt =
    metaDescription ||
    html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220);

  const payload = {
    type: 'post',
    slug: p.slug,
    title: p.title,
    content: html,
    excerpt,
    featuredImage,
    ogImage: featuredImage,
    category: 'Blog',
    metaTitle,
    metaDescription,
    focusKeyword,
    keywords: secondary,
    tags: secondary.slice(0, 8),
    published: true,
    publishedAt: p.publishedAt,
    notifyPush: false,
    pullFromCms: false,
  };

  const result = await syncPost(payload);
  console.log(p.slug, result.status, result.json.success, result.json.message || result.json.message || '');
  if (!result.json.success) {
    console.error(result.json);
    process.exit(1);
  }

  outSeed.push({
    ...payload,
    featuredImagePath: p.image,
  });
}

const seedPath = path.join(root, 'apps/strapi/data/three-college-blogs-seed.json');
fs.mkdirSync(path.dirname(seedPath), { recursive: true });
fs.writeFileSync(seedPath, JSON.stringify(outSeed, null, 2));
console.log('Wrote', seedPath);
console.log('Done. Verify:');
for (const p of posts) console.log(`  ${site}/blog/${p.slug}`);
