/**
 * Repair the 3 college blogs: clean content, FAQs, tables, schemaJson, excerpts, images.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = path.join(process.env.TEMP || '/tmp', 'ar-blogs');
const site = 'https://www.argroupofeducation.com';
const gh =
  'https://raw.githubusercontent.com/argroupads-eduction/argroup-education/hostinger-live/apps/frontend/public/images/blog';

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractSchemas(raw) {
  const schemas = [];
  let body = raw;
  const re = /<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/gi;
  body = body.replace(re, (_, json) => {
    try {
      schemas.push(JSON.parse(json.trim()));
    } catch {
      /* ignore */
    }
    return '\n';
  });
  // Author labels left in Google Docs exports
  body = body.replace(/^\s*Article\s*\/\s*BlogPosting\s*Schema\s*$/gim, '\n');
  body = body.replace(/^\s*FAQPage\s*Schema\s*$/gim, '\n');
  body = body.replace(/^\s*Article\s*Schema\s*$/gim, '\n');
  // Any leftover JSON-LD blobs
  body = body.replace(/\{\s*"@context"\s*:\s*"https?:\/\/schema\.org"[\s\S]*?\n\}\s*(?=\n|$)/g, '\n');
  return { body, schemas };
}

function parseMetaAndBody(raw) {
  const { body: withoutScripts, schemas } = extractSchemas(raw.replace(/^\uFEFF/, ''));
  const lines = withoutScripts.replace(/\r\n/g, '\n').split('\n');
  const meta = {};
  const bodyLines = [];
  const metaRe =
    /^(Meta Title|Meta Description|Primary Keyword|Secondary Keywords|Secondary Keyword|External Keyword|Primary Keywords|External Keywords)\s*[:—\-]\s*(.*)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(metaRe);
    if (m) {
      let val = m[2].trim();
      if (!val && i + 1 < lines.length && lines[i + 1].trim() && !metaRe.test(lines[i + 1])) {
        val = lines[++i].trim();
      }
      meta[m[1].toLowerCase()] = val;
      continue;
    }
    // Drop schema section labels / empty
    if (/schema\s*$/i.test(line.trim()) && /article|faq|blog/i.test(line)) continue;
    bodyLines.push(line);
  }
  while (bodyLines.length && !bodyLines[0].trim()) bodyLines.shift();
  // Drop duplicate H1 title if first non-empty line matches post title closely
  return { meta, bodyLines, schemas };
}

function isMoneyOrStat(s) {
  return /^(₹|Rs\.?|\$)?[\d,]+(\.\d+)?(\+|%| crore| lakh)?$/i.test(s.trim()) ||
    /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s.trim()) ||
    /^\d+\+$/.test(s.trim()) ||
    /^\d{1,3}(,\d{3})*\s*to\s*\d/i.test(s.trim());
}

function buildFaqHtml(faqs) {
  if (!faqs.length) return '';
  const items = faqs
    .map((f, i) => {
      const n = String(i + 1).padStart(2, '0');
      return `<details class="wp-premium-faq" style="--faq-i:${i}"><summary class="wp-premium-faq-summary"><span class="wp-premium-faq-qnum">${n}</span><span class="wp-premium-faq-qtext">${escapeHtml(f.q)}</span></summary><div class="wp-premium-faq-body"><div class="wp-premium-faq-body-inner"><p class="wp-premium-faq-answer">${escapeHtml(f.a)}</p></div></div></details>`;
    })
    .join('');
  return `<h2>Frequently Asked Questions</h2>\n<div class="wp-premium-faq-group wp-premium-faq-group--animated">${items}</div>`;
}

function buildKvTable(title, pairs) {
  if (!pairs.length) return '';
  let html = `<div class="eael-data-table-wrap"><table class="eael-data-table wp-facts-kv-table"><thead><tr><th colspan="2">${escapeHtml(title)}</th></tr></thead><tbody>`;
  for (const [k, v] of pairs) {
    html += `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`;
  }
  html += '</tbody></table></div>';
  return html;
}

function convertBody(bodyLines, title) {
  const blocks = [];
  const faqs = [];
  let i = 0;
  let para = [];
  let inFaq = false;

  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(' ').replace(/\s+/g, ' ').trim();
    para = [];
    if (!text) return;
    // skip duplicate title / meta leftovers
    if (text === title || text.length < 3) return;
    if (/^(Meta Title|Meta Description|Primary Keyword|Secondary Keywords|External Keyword)\s*:/i.test(text))
      return;
    if (text.endsWith('?') && text.length < 140 && !text.includes('. ')) {
      blocks.push(`<h2>${escapeHtml(text)}</h2>`);
    } else if (
      text.length < 90 &&
      !/[.!]/.test(text) &&
      /^[A-Z0-9]/.test(text) &&
      !/^(Step \d+|Important)/i.test(text)
    ) {
      blocks.push(`<h2>${escapeHtml(text)}</h2>`);
    } else {
      blocks.push(`<p>${escapeHtml(text)}</p>`);
    }
  };

  while (i < bodyLines.length) {
    const rawLine = bodyLines[i];
    const line = rawLine.replace(/^\t+/, '');
    const trimmed = line.trim();

    if (/^FAQs\b|^Frequently Asked Questions\b/i.test(trimmed)) {
      flushPara();
      inFaq = true;
      i++;
      continue;
    }

    if (inFaq) {
      const qm = trimmed.match(/^(?:Q\.?\s*)?(\d+)[.)]?\s+(.+\?)\s*$/i);
      if (qm) {
        const q = qm[2].trim();
        const ans = [];
        i++;
        while (i < bodyLines.length) {
          const t = bodyLines[i].trim();
          if (!t) {
            i++;
            if (ans.length) break;
            continue;
          }
          if (/^(?:Q\.?\s*)?\d+[.)]?\s+/.test(t) || /^<script/i.test(t) || t.startsWith('{')) break;
          ans.push(t.replace(/^Answer:\s*/i, ''));
          i++;
        }
        faqs.push({ q, a: ans.join(' ').replace(/\s+/g, ' ').trim() });
        continue;
      }
      if (!trimmed || trimmed.startsWith('{') || /^<script/i.test(trimmed)) {
        i++;
        continue;
      }
      i++;
      continue;
    }

    if (
      /^(Fee Component|Counselling Stage|Category)$/i.test(trimmed) ||
      (/^[A-Z][A-Za-z0-9 &–—\-/,()]{2,60}$/.test(trimmed) &&
        i + 1 < bodyLines.length &&
        /^\t/.test(bodyLines[i + 1]) &&
        !/[.?!]$/.test(trimmed) &&
        trimmed.length < 70)
    ) {
      const looksLikeTableStart =
        /^(Fee Component|Counselling Stage|Category)$/i.test(trimmed) ||
        (/^\t/.test(bodyLines[i + 1] || '') &&
          /rank|fee|category|marks|expected|general|opening|closing|nri|tuition/i.test(
            (bodyLines[i + 1] || '') + (bodyLines[i + 2] || '')
          ));
      if (looksLikeTableStart) {
        flushPara();
        let tableTitle = trimmed;
        i++;
        // optional subtitle / second header cell
        if (
          i < bodyLines.length &&
          /^\t/.test(bodyLines[i]) &&
          /category|rank|expected|marks|fee/i.test(bodyLines[i]) &&
          !isMoneyOrStat(bodyLines[i].trim())
        ) {
          const sub = bodyLines[i].replace(/^\t+/, '').trim();
          if (sub.length < 80 && !/[.!]/.test(sub)) {
            tableTitle = `${tableTitle} — ${sub}`;
            i++;
          }
        }
        const pairs = [];
        while (i < bodyLines.length) {
          const rawA = bodyLines[i];
          const a = rawA.replace(/^\t+/, '').trim();
          if (!a) {
            i++;
            break;
          }
          if (
            a.length > 100 ||
            (/[.!]/.test(a) && a.length > 50) ||
            /^How |^What |^Is |^Can |^Why |^Frequently|^Students |^According /i.test(a) ||
            a.endsWith('?')
          ) {
            break;
          }
          const b = (bodyLines[i + 1] || '').replace(/^\t+/, '').trim();
          if (!b) break;
          if (
            b.length > 120 ||
            (/[.!]/.test(b) && b.length > 60 && !isMoneyOrStat(b) && !/to\s+\d/i.test(b))
          ) {
            break;
          }
          // label / value pair (often tab-prefixed lines)
          if (!isMoneyOrStat(a) || /ranks?|fee|charge|hostel|mess|quota|category/i.test(a)) {
            pairs.push([a, b]);
            i += 2;
            continue;
          }
          break;
        }
        if (pairs.length >= 2) {
          blocks.push(buildKvTable(tableTitle, pairs));
          continue;
        }
        // fall through if not enough pairs
        i -= pairs.length * 2 + 1;
      }
    }

    // Category / Expected marks table (tab-separated rows)
    if (trimmed.includes('\t') && /category|expected|general|obc|marks|rank/i.test(trimmed)) {
      flushPara();
      const rows = [];
      while (i < bodyLines.length && bodyLines[i].includes('\t')) {
        const parts = bodyLines[i].split('\t').map((s) => s.trim()).filter(Boolean);
        if (parts.length >= 2) rows.push(parts);
        else if (parts.length === 1 && rows.length) {
          // orphan cell — pair with next
        }
        i++;
      }
      // Also handle Category\n\tExpected style alternating single cells with tabs prefix
      if (rows.length >= 2) {
        let html = '<div class="eael-data-table-wrap"><table class="eael-data-table wp-facts-kv-table"><thead><tr>';
        const head = rows[0];
        for (const c of head) html += `<th>${escapeHtml(c)}</th>`;
        html += '</tr></thead><tbody>';
        for (const row of rows.slice(1)) {
          html += '<tr>';
          for (const c of row) html += `<td>${escapeHtml(c)}</td>`;
          html += '</tr>';
        }
        html += '</tbody></table></div>';
        blocks.push(html);
      }
      continue;
    }

    // Alternating Category / Expected 2026 block without tabs (Category, Expected 2026, General, 650+, ...)
    if (/^Category$/i.test(trimmed) && /expected/i.test((bodyLines[i + 1] || '').trim())) {
      flushPara();
      const header1 = trimmed;
      const header2 = bodyLines[i + 1].trim();
      i += 2;
      const pairs = [];
      while (i + 1 < bodyLines.length) {
        const a = bodyLines[i].trim();
        const b = bodyLines[i + 1].trim();
        if (!a || a.endsWith('?') || /^How |^What |^Can |^Is /i.test(a)) break;
        if (!b) break;
        pairs.push([a, b]);
        i += 2;
      }
      if (pairs.length) {
        let html = `<div class="eael-data-table-wrap"><table class="eael-data-table wp-facts-kv-table"><thead><tr><th>${escapeHtml(header1)}</th><th>${escapeHtml(header2)}</th></tr></thead><tbody>`;
        for (const [k, v] of pairs) html += `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`;
        html += '</tbody></table></div>';
        blocks.push(html);
      }
      continue;
    }

    if (!trimmed) {
      flushPara();
      i++;
      continue;
    }

    if (/^\*\s+/.test(trimmed)) {
      flushPara();
      const items = [];
      while (i < bodyLines.length && /^\*\s+/.test(bodyLines[i].trim())) {
        items.push(bodyLines[i].trim().replace(/^\*\s+/, ''));
        i++;
      }
      blocks.push(`<ul>${items.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^Step \d+:/i.test(trimmed)) {
      flushPara();
      const title = trimmed;
      i++;
      const ans = [];
      while (i < bodyLines.length) {
        const t = bodyLines[i].trim();
        if (!t || /^Step \d+:/i.test(t) || /^How |^What |^Is |^Can |^Frequently/i.test(t)) break;
        ans.push(t);
        i++;
      }
      blocks.push(
        `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(ans.join(' ').replace(/\s+/g, ' '))}</p>`
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed) && !trimmed.includes('?')) {
      flushPara();
      const items = [];
      while (i < bodyLines.length && /^\d+\.\s+/.test(bodyLines[i].trim()) && !bodyLines[i].includes('?')) {
        items.push(bodyLines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      // numbered factor headings with following paragraph
      if (items.length === 1) {
        blocks.push(`<h3>${escapeHtml(items[0])}</h3>`);
      } else {
        blocks.push(`<ol>${items.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ol>`);
      }
      continue;
    }

    para.push(trimmed);
    i++;
  }
  flushPara();

  let html = blocks.join('\n');
  html = html.replace(/<\/ul>\n<ul>/g, '').replace(/<\/ol>\n<ol>/g, '');
  if (faqs.length) html += '\n' + buildFaqHtml(faqs);
  return { html, faqs };
}

function schemaFromDoc(schemas, faqs, post) {
  const article = schemas.find((s) => s['@type'] === 'Article') || {
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishedAt.slice(0, 10),
    dateModified: post.publishedAt.slice(0, 10),
    author: { '@type': 'Organization', name: 'AR Group of Education', url: site },
    publisher: {
      '@type': 'Organization',
      name: 'AR Group of Education',
      logo: { '@type': 'ImageObject', url: `${site}/ar-group-logo.webp` },
    },
    image: [post.featuredImage],
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${site}/blog/${post.slug}` },
    inLanguage: 'en-IN',
  };
  article.image = [post.featuredImage];
  article.mainEntityOfPage = { '@type': 'WebPage', '@id': `${site}/blog/${post.slug}` };

  let faq = schemas.find((s) => s['@type'] === 'FAQPage');
  if (!faq && faqs.length) {
    faq = {
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [article, ...(faq ? [faq] : [])],
  };
}

export { loadEnv, parseMetaAndBody, convertBody, schemaFromDoc, escapeHtml, site, gh };

const isDirect =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (!isDirect) {
  // imported as a helper module
} else {
const posts = [
  {
    file: 'mamc.txt',
    slug: 'neet-marks-required-for-maulana-azad-medical-college',
    title: 'NEET Marks Required for Maulana Azad Medical College (MAMC) 2026',
    imageFile: 'neet-marks-mamc-2026.webp',
    publishedAt: '2026-08-17T10:00:00.000Z',
  },
  {
    file: 'kasturba.txt',
    slug: 'how-much-neet-score-is-required-for-kasturba-medical-college',
    title: 'How Much NEET Score Is Required for Kasturba Medical College?',
    imageFile: 'neet-score-kasturba-medical-college.webp',
    publishedAt: '2026-08-18T10:00:00.000Z',
  },
  {
    file: 'amrita.txt',
    slug: 'neet-cut-off-for-mbbs-at-amrita-institute-of-medical-sciences-kochi',
    title: 'What Is the NEET Cut Off for MBBS at Amrita Institute of Medical Sciences Kochi?',
    imageFile: 'neet-cutoff-amrita-kochi.webp',
    publishedAt: '2026-08-19T10:00:00.000Z',
  },
];

const env = loadEnv(path.join(root, 'apps/frontend/.env.local'));
const secret = env.PAYLOAD_SYNC_SECRET || env.REVALIDATE_SECRET;
if (!secret && process.env.DRY_RUN !== '1') {
  console.error('Missing sync secret');
  process.exit(1);
}

for (const p of posts) {
  const raw = fs.readFileSync(path.join(tmp, p.file), 'utf8');
  const { meta, bodyLines, schemas } = parseMetaAndBody(raw);
  const { html, faqs } = convertBody(bodyLines, p.title);
  const featuredImage = `${gh}/${p.imageFile}`;
  const metaTitle = meta['meta title'] || p.title;
  const metaDescription =
    meta['meta description'] ||
    html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  const focusKeyword = meta['primary keyword'] || '';
  const keywords = (meta['secondary keywords'] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Ensure no schema leftovers in HTML
  if (/ld\+json|@context|FAQPage/i.test(html)) {
    console.warn('WARN still has schema text in html for', p.slug);
  }

  const schemaJson = schemaFromDoc(schemas, faqs, {
    ...p,
    featuredImage,
    metaDescription,
  });

  const payload = {
    type: 'post',
    slug: p.slug,
    title: p.title,
    content: html,
    excerpt: metaDescription,
    featuredImage,
    ogImage: featuredImage,
    category: 'Blog',
    metaTitle,
    metaDescription,
    focusKeyword,
    keywords,
    tags: keywords.slice(0, 8),
    schemaJson,
    published: true,
    publishedAt: p.publishedAt,
    notifyPush: false,
    pullFromCms: false,
  };

  const hasSchemaLeak = /ld\+json|@context|<script|FAQPage\s*Schema|BlogPosting\s*Schema/i.test(html);
  const tableCount = (html.match(/<table/gi) || []).length;
  const faqCount = (html.match(/wp-premium-faq"/g) || []).length;
  console.log(
    p.slug,
    'html',
    html.length,
    'faqs',
    faqs.length,
    'faqHtml',
    faqCount,
    'tables',
    tableCount,
    'schemaLeak',
    hasSchemaLeak
  );
  if (hasSchemaLeak) {
    console.error('SCHEMA LEAK in content');
    process.exit(1);
  }

  if (process.env.DRY_RUN === '1') {
    const outDir = path.join(tmp, 'repaired');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `${p.slug}.html`), html);
    fs.writeFileSync(path.join(outDir, `${p.slug}.schema.json`), JSON.stringify(schemaJson, null, 2));
    continue;
  }

  const res = await fetch(`${site}/api/cms/payload-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  console.log(p.slug, res.status, text.includes('"success":true'));
  if (!text.includes('"success":true')) {
    console.error(text.slice(0, 400));
    process.exit(1);
  }
}

console.log(process.env.DRY_RUN === '1' ? 'Dry-run OK' : 'Republished OK');
}
