/**
 * Repair flattened Google-Doc / CMS blog HTML at render time:
 * - promote section questions & short titles buried inside long paragraphs
 * - demote junk false headings / body H1s
 * - promote major H3 section titles to H2 for SEO indexing
 * - rebuild scrambled tables + wrap for mobile scroll / card layout
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripTags(html: string): string {
  return decodeBasicEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

/** Numbered FAQ / section questions: "01 What…?", "1. Is…?", "(2) How…?" */
const QUESTION_HEADING_RE =
  /(?:^|(?<=[.!?]["']?\s+))((?:\d{1,2}[.)]?\s+|\(\d{1,2}\)\s+)?(?:What|Why|How|Is|Can|Which|When|Where|Who|Do|Does|Are|Should|Will|Before)\b[^.!?]{3,110}\?)/g;

/** Colon lead-ins stay as H3 (sub-heads), not H2. */
const LEAD_IN_HEADING_RE =
  /(?:^|(?<=[.!?]["']?\s+))((?:Some major reasons|Popular MD specializations|Common MS specializations|Examples may include|Career opportunities may include|This pathway can lead|When evaluating|Before selecting|Before seeking|Other alternative careers|The general process|The basic process|To improve your chances|Students should consider|Students should check|At the time of Counselling candidates)[^.!?]{0,70}:)/gi;

/** Exact short takeaway phrases only (no trailing prose). */
const TAKEAWAY_HEADING_RE =
  /(?:^|(?<=[.!?]["']?\s+))((?:Final Takeaway|Key Takeaways?|Quick Summary|Conclusion))(?=\s+[A-Z("]|$)/g;

/** "Title — Subtitle The body starts…" */
const EM_DASH_SECTION_RE =
  /(?:^|(?<=[.!?]["']?\s+))((?:[A-Z][A-Za-z0-9/'&(),-]*)(?:\s+[A-Za-z0-9/'&(),-]+){1,10}\s*[—–]\s*[A-Z][^.!?]{3,70}?)(?=\s+(?:The|This|These|Those|Candidates?|Students?|Competition|You|It|In|If|For|After|Before|A|An|There|Clearing|Actual|Just|Note)\b)/g;

/**
 * Title-Case sections mashed into prose, followed by a sentence opener.
 * Example: "Marks Required for MD in Government Medical Colleges Competition for…"
 */
const TITLE_CASE_SECTION_RE =
  /(?:^|(?<=[.!?]["']?\s+))((?:[A-Z][A-Za-z0-9/'&(),-]*)(?:\s+(?:[A-Z0-9(/][A-Za-z0-9/'&(),.-]*|for|of|in|on|to|and|vs|Vs|with|without|after|before|the|a|an|MD\/MS|NEET|PG|MBBS|BAMS|BHMS)){2,12})(?=\s+(?:The|This|These|Those|Candidates?|Students?|Competition|You|It|In|If|For|After|Before|A|An|There|Clearing|Actual|Just|Therefore)\b)/g;

const KNOWN_SHORT_SECTIONS =
  /^(Approximate Cost|Qualifying Percentile|Eligibility|Admission Process|Counselling Process|Counseling Process|Fee Structure|Documents Required|Key Highlights|Final Takeaway|Key Takeaways?|Quick Summary|Conclusion|Syllabus|Cutoff|Cut-?off|Seat Matrix|Preparation Tips|Career Scope|Hostel Facilities|Miscellaneous Expenses|Frequently Asked Questions|FAQs?|Importance of NEET PG Counseling)$/i;

const JUNK_H2_RE =
  /^(for example|note|important|tip|remember|also|however|therefore|thus|so|yes|no|pros|cons|summary|overview|introduction|conclusion|details|particular|latest blogs)$/i;

const LEAD_IN_KEEP_H3_RE =
  /^(some major reasons|popular md|common ms|examples may|career opportunities|this pathway|when evaluating|before selecting|before seeking|other alternative|the general process|the basic process|to improve your|students should|at the time of)/i;

function isLikelyCourseName(text: string): boolean {
  return /^(MD|MS|DM|MCh|DNB|MBA|MPH|PG|BAMS|BHMS|MBBS|NEET)\b/i.test(text.trim());
}

function isLikelySetting(text: string): boolean {
  return /hospital|clinic|centre|center|college|university|institution|practice|counselling|counseling|private|government|research|trauma|diagnostic/i.test(
    text
  );
}

function cleanHeadingText(text: string): string {
  return text
    .replace(/^\d{1,2}[.)]?\s+/, '')
    .replace(/^\(\d{1,2}\)\s+/, '')
    .replace(/\s+(?:for|of|in|on|to|and|vs|with|the|a|an)$/i, '')
    .trim();
}

function looksLikeIncompleteHeading(text: string): boolean {
  if (
    /\b(for|of|in|on|to|and|vs|with|the|a|an|these|those|your|our|into|from|by|as|at|or|its|their)$/i.test(
      text
    )
  ) {
    return true;
  }
  if (text.split(/\s+/).length < 2) return true;
  return false;
}

function promoteEmbeddedHeadingsInParagraphs(html: string): string {
  return html.replace(/<p(\b[^>]*)>([\s\S]*?)<\/p>/gi, (full, attrs: string, inner: string) => {
    if (/<(?:ul|ol|table|img|h[1-6]|div|figure|blockquote)\b/i.test(inner)) return full;

    const plain = stripTags(inner);
    if (plain.length < 60) return full;

    type Hit = { start: number; end: number; text: string; level: 'h2' | 'h3' };
    const hits: Hit[] = [];

    const pushHit = (start: number, end: number, text: string, level: 'h2' | 'h3') => {
      const cleaned = cleanHeadingText(text);
      if (cleaned.length < 10 || cleaned.length > 100) return;
      if (looksLikeIncompleteHeading(cleaned) && !cleaned.endsWith('?')) return;
      if (JUNK_H2_RE.test(cleaned)) return;
      hits.push({ start, end, text: cleaned, level });
    };

    for (const re of [
      QUESTION_HEADING_RE,
      LEAD_IN_HEADING_RE,
      TAKEAWAY_HEADING_RE,
      EM_DASH_SECTION_RE,
      TITLE_CASE_SECTION_RE,
    ]) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(plain)) !== null) {
        const raw = m[1].trim();
        if (
          (re === TITLE_CASE_SECTION_RE || re === EM_DASH_SECTION_RE) &&
          !/\b(Eligibility|Admission|Process|Counselling|Counseling|Cutoff|Cut-?off|Marks?|Rank|Percentile|Fee|Fees|Cost|Documents?|Preparation|Career|Scope|Requirements?|Criteria|Strategy|Tips|Benefits?|Quota|Seat|Syllabus|Hostel|Visa|Takeaway|Overview|Highlights?|Speciali[sz]ations?|College|University|NEET|MBBS|MD|MS|BAMS|BHMS|Russia|Abroad|Qualifying|Improve|Score|Private|Government|Deemed|Mistakes?|Importance|Difference|Comparison|Expense|Tuition)\b/i.test(
            raw
          )
        ) {
          continue;
        }
        const level: 'h2' | 'h3' = re === LEAD_IN_HEADING_RE ? 'h3' : 'h2';
        pushHit(m.index, m.index + m[1].length, raw, level);
      }
    }

    if (!hits.length) return full;

    hits.sort((a, b) => a.start - b.start);
    const unique: Hit[] = [];
    for (const hit of hits) {
      const prev = unique[unique.length - 1];
      if (prev && hit.start < prev.end) continue;
      if (hit.start === 0 && hit.end >= plain.length - 1) continue;
      unique.push(hit);
    }
    if (!unique.length) return full;

    const parts: string[] = [];
    let cursor = 0;
    for (const hit of unique) {
      const before = plain.slice(cursor, hit.start).trim();
      if (before) parts.push(`<p${attrs}>${escapeHtml(before)}</p>`);
      parts.push(`<${hit.level}>${escapeHtml(hit.text)}</${hit.level}>`);
      cursor = hit.end;
    }
    const after = plain.slice(cursor).trim();
    if (after) parts.push(`<p${attrs}>${escapeHtml(after)}</p>`);
    return parts.join('\n') || full;
  });
}

function demoteJunkHeadings(html: string): string {
  return html.replace(/<(h2|h3)(\b[^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag, attrs, inner) => {
    const text = stripTags(inner);
    if (!text) return '';
    if (JUNK_H2_RE.test(text) || (text.length < 18 && /[:.]$/.test(text) && !KNOWN_SHORT_SECTIONS.test(text))) {
      return `<p${attrs}><strong>${inner}</strong></p>`;
    }
    if (/^for example\b/i.test(text) && text.length < 40) {
      return `<p${attrs}><strong>${inner}</strong></p>`;
    }
    if (looksLikeIncompleteHeading(text) && !text.endsWith('?') && !KNOWN_SHORT_SECTIONS.test(text)) {
      return `<p${attrs}><strong>${escapeHtml(text)}</strong></p>`;
    }
    if (LEAD_IN_KEEP_H3_RE.test(text) && tag === 'h2') {
      return `<h3${attrs}>${inner}</h3>`;
    }
    if (
      text.length < 90 &&
      /\d{2,}/.test(text) &&
      /hospital|bedded|beds?|seats?|closing rank|opening rank/i.test(text) &&
      !text.endsWith('?')
    ) {
      return `<p${attrs}>${inner}</p>`;
    }
    return full;
  });
}

function demoteBodyH1ToH2(html: string): string {
  return html.replace(/<h1(\b[^>]*)>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>');
}

function promoteMajorH3ToH2(html: string): string {
  return html.replace(/<h3(\b[^>]*)>([\s\S]*?)<\/h3>/gi, (full, attrs, inner) => {
    // FAQ accordion questions stay H3 under the "Frequently Asked Questions" H2.
    if (/\bwp-faq-heading\b/i.test(attrs) || /\bwp-faq-heading\b/i.test(full)) return full;
    const text = stripTags(inner);
    if (!text || text.length < 8 || text.length > 100) return full;
    if (/^step\s*\d+/i.test(text)) return full;
    if (JUNK_H2_RE.test(text)) return full;
    if (LEAD_IN_KEEP_H3_RE.test(text) || /:$/.test(text)) return full;
    if (looksLikeIncompleteHeading(text) && !text.endsWith('?')) return full;
    // Keep tiny 1–2 word benefit chips as H3 under a parent H2.
    if (text.split(/\s+/).length <= 2 && !KNOWN_SHORT_SECTIONS.test(text) && !text.endsWith('?')) {
      return full;
    }
    return `<h2${attrs}>${inner}</h2>`;
  });
}

function extractCellTexts(rowHtml: string): string[] {
  return [...rowHtml.matchAll(/<t[dh](\b[^>]*)>([\s\S]*?)<\/t[dh]>/gi)].map((m) =>
    stripTags(m[2])
  );
}

function buildHtmlTable(headers: string[], bodyCells: string[], cols: number): string {
  const stream = bodyCells.slice();
  while (stream.length % cols !== 0) stream.push('—');
  let out = `<table class="eael-data-table wp-blog-data-table wp-table-cols-${cols}"><thead><tr>`;
  for (const h of headers) out += `<th>${escapeHtml(h)}</th>`;
  out += '</tr></thead><tbody>';
  for (let i = 0; i < stream.length; i += cols) {
    out += '<tr>';
    for (let c = 0; c < cols; c++) out += `<td>${escapeHtml(stream[i + c] || '—')}</td>`;
    out += '</tr>';
  }
  out += '</tbody></table>';
  return out;
}

function collectTableCells(tableHtml: string): string[] {
  const rows = [...tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const cells: string[] = [];
  for (const row of rows) {
    for (const t of extractCellTexts(row[1])) {
      if (t) cells.push(t);
    }
  }
  return cells;
}

function tryRepairCourseThreeCol(cells: string[]): string | null {
  let stream = cells.slice();
  while (
    stream.length &&
    /^(broad career area|common work setting|course|particular|details|category|fee component|counselling stage)$/i.test(
      stream[0]
    )
  ) {
    stream = stream.slice(1);
  }
  if (stream.length < 6) return null;
  while (stream.length % 3 !== 0) stream.push('—');

  let courseHits = 0;
  let settingHits = 0;
  const triples = stream.length / 3;
  for (let i = 0; i < stream.length; i += 3) {
    if (isLikelyCourseName(stream[i])) courseHits++;
    if (isLikelySetting(stream[i + 2] || '')) settingHits++;
  }
  if (courseHits < Math.max(2, Math.floor(triples * 0.5))) return null;
  if (settingHits < Math.max(2, Math.floor(triples * 0.4))) return null;

  return buildHtmlTable(
    ['Course', 'Broad Career Area', 'Common Work Setting'],
    stream,
    3
  );
}

function tryRepairCutoffThreeCol(cells: string[]): string | null {
  if (cells.length < 8) return null;
  const split = cells[0].split(/\s*[—–]\s*/);
  if (split.length < 2) return null;
  if (!/category|percentile|rank|marks|score|round/i.test(cells[0])) return null;

  const headers = [split[0].trim(), split.slice(1).join(' — ').trim(), cells[1]].filter(Boolean);
  if (headers.length !== 3) return null;
  const stream = cells.slice(2);
  if (stream.length < 6) return null;
  if (!/general|obc|sc|st|ews|pwd|round|aiq|state/i.test(stream[0])) return null;
  return buildHtmlTable(headers, stream, 3);
}

function tryRepairYearMatrix(cells: string[]): string | null {
  if (cells.length < 8) return null;
  if (!/^year$/i.test(cells[0])) return null;
  const headers = cells.slice(0, 4);
  if (headers.some((h) => h.length > 40)) return null;
  const stream = cells.slice(4);
  if (stream.length < 4) return null;
  return buildHtmlTable(headers, stream, 4);
}

function tryRepairComparisonThreeCol(cells: string[]): string | null {
  if (cells.length < 8) return null;
  const looksLikeColTitle = (t: string) =>
    t.length < 48 &&
    !/^(fees|competition|seats|admission|cutoff|duration|eligibility)$/i.test(t) &&
    /government|private|college|university|deemed|state|aiq/i.test(t);

  if (!looksLikeColTitle(cells[0]) || !looksLikeColTitle(cells[1])) return null;
  if (!/^(fees|competition|seats|admission|cutoff|hostel|location|recognition)$/i.test(cells[2])) {
    return null;
  }

  const headers = ['Factor', cells[0], cells[1]];
  const stream = cells.slice(2);
  return buildHtmlTable(headers, stream, 3);
}

function tryRepairKvTwoCol(cells: string[]): string | null {
  if (cells.length < 5) return null;
  const title = cells[0];
  if (title.length < 12 || title.length > 90) return null;
  if (!/round|rank|fee|cutoff|closing|opening|particular|overview|detail/i.test(title)) return null;

  const stream = cells.slice(1);
  if (stream.length < 4) return null;

  let pairHits = 0;
  const pairCount = Math.floor(stream.length / 2);
  for (let i = 0; i + 1 < stream.length; i += 2) {
    if (/round|rank|closing|general|obc|sc|st|year|nri|tuition|hostel/i.test(stream[i])) pairHits++;
    else if (/\d/.test(stream[i + 1])) pairHits++;
  }
  if (pairHits < Math.max(2, Math.floor(pairCount * 0.5))) return null;

  const headers =
    title.includes('—') || title.includes('–')
      ? title.split(/\s*[—–]\s*/).slice(0, 2)
      : ['Detail', 'Value'];
  while (headers.length < 2) headers.push('Value');
  return buildHtmlTable(headers.slice(0, 2), stream, 2);
}

function repairBrokenDataTables(html: string): string {
  return html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (table) => {
    const cells = collectTableCells(table);
    if (cells.length < 5) return table;

    return (
      tryRepairCourseThreeCol(cells) ||
      tryRepairCutoffThreeCol(cells) ||
      tryRepairYearMatrix(cells) ||
      tryRepairComparisonThreeCol(cells) ||
      tryRepairKvTwoCol(cells) ||
      table
    );
  });
}

function ensureTableScrollWrappers(html: string): string {
  let out = html.replace(
    /<(div|figure)\b([^>]*\b(?:eael-data-table-wrap|wp-block-table)\b[^>]*)>/gi,
    (full, tag: string, attrs: string) => {
      if (/\bwp-table-scroll\b/i.test(attrs)) return full;
      if (/\bclass="/i.test(attrs)) {
        return `<${tag}${attrs.replace(/\bclass="/i, 'class="wp-table-scroll ')}>`;
      }
      return `<${tag} class="wp-table-scroll"${attrs}>`;
    }
  );

  out = out.replace(/<table\b[\s\S]*?<\/table>/gi, (table, offset: number, whole: string) => {
    const before = whole.slice(Math.max(0, offset - 160), offset);
    if (/wp-table-scroll|eael-data-table-wrap|wp-block-table/i.test(before)) {
      return table;
    }
    let tagged = table;
    if (!/\bwp-blog-data-table\b/i.test(table)) {
      tagged = table.replace(/<table\b([^>]*)>/i, (_m, attrs: string) => {
        if (/\bclass="/i.test(attrs)) {
          return `<table${attrs.replace(/\bclass="/i, 'class="wp-blog-data-table ')}>`;
        }
        return `<table class="wp-blog-data-table"${attrs}>`;
      });
    }
    return `<div class="wp-table-scroll eael-data-table-wrap">${tagged}</div>`;
  });

  return out;
}

function promoteStandaloneTitleParagraphs(html: string): string {
  return html.replace(/<p(\b[^>]*)>([\s\S]*?)<\/p>/gi, (full, attrs: string, inner: string) => {
    if (
      /<(?:ul|ol|table|img|a|strong|em|h[1-6])\b/i.test(inner) &&
      !/^<strong>[^<]+<\/strong>$/i.test(inner.trim())
    ) {
      if (!/^<strong>[^<]{8,110}<\/strong>$/i.test(inner.trim())) return full;
    }
    const text = stripTags(inner);
    if (text.length < 8 || text.length > 110) return full;

    if (KNOWN_SHORT_SECTIONS.test(text)) {
      return `<h2${attrs}>${escapeHtml(text)}</h2>`;
    }

    const cleaned = cleanHeadingText(text);
    if (cleaned.endsWith('?') && !cleaned.includes('. ') && cleaned.length >= 12) {
      return `<h2${attrs}>${escapeHtml(cleaned)}</h2>`;
    }

    if (
      !/[.!]/.test(text) &&
      /^[A-Z0-9]/.test(text) &&
      !JUNK_H2_RE.test(text) &&
      !/^(step \d+|note|tip)/i.test(text) &&
      !/\d{2,}/.test(text) &&
      !looksLikeIncompleteHeading(text)
    ) {
      const words = text.split(/\s+/);
      const capped = words.filter((w) => /^[A-Z0-9]/.test(w)).length;
      if (words.length >= 2 && words.length <= 14 && capped / words.length >= 0.55) {
        return `<h2${attrs}>${escapeHtml(text)}</h2>`;
      }
    }
    return full;
  });
}

/** Convert premium FAQ question text into H3 for crawlable outline (summary stays). */
function promoteFaqQuestionsToHeadings(html: string): string {
  return html.replace(
    /<summary(\b[^>]*)>([\s\S]*?)<\/summary>/gi,
    (full, attrs: string, inner: string) => {
      if (/<h[1-6]\b/i.test(inner)) return full;
      const qtextMatch = inner.match(/wp-premium-faq-qtext[^>]*>([\s\S]*?)<\//i);
      const text = stripTags(qtextMatch ? qtextMatch[1] : inner);
      if (!text || text.length < 12 || text.length > 140) return full;
      if (!text.endsWith('?') && !/^(what|why|how|is|can|which|when|where|who|do|does|are|should|will)\b/i.test(text)) {
        return full;
      }
      // Keep accordion UI; inject visually-styled H3 inside summary for SEO outline.
      if (qtextMatch) {
        return `<summary${attrs}>${inner.replace(
          /(wp-premium-faq-qtext[^>]*>)([\s\S]*?)(<\/)/i,
          `$1<h3 class="wp-faq-heading">$2</h3>$3`
        )}</summary>`;
      }
      return `<summary${attrs}><h3 class="wp-faq-heading">${escapeHtml(text)}</h3></summary>`;
    }
  );
}

export function normalizeBlogArticleHtml(html: string): string {
  if (!html?.trim()) return html || '';
  let out = html;
  out = demoteBodyH1ToH2(out);
  out = promoteEmbeddedHeadingsInParagraphs(out);
  out = promoteStandaloneTitleParagraphs(out);
  out = promoteMajorH3ToH2(out);
  out = demoteJunkHeadings(out);
  out = promoteFaqQuestionsToHeadings(out);
  out = repairBrokenDataTables(out);
  out = ensureTableScrollWrappers(out);
  return out;
}

