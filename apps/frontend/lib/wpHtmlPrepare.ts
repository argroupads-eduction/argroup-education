/** Prepare migrated WordPress HTML for premium display (content unchanged semantically). */

function normUrl(url: string): string {
  return url
    .replace(/^https?:\/\/(www\.)?argroupofeducation\.com/i, '')
    .replace(/-\d+x\d+(?=\.[a-z]+$)/i, '')
    .replace(/elementor\/thumbs\//i, 'uploads/')
    .split('?')[0]
    .toLowerCase();
}

function urlsMatch(a: string, b: string): boolean {
  const na = normUrl(a);
  const nb = normUrl(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Remove hero duplicate: featured image + first matching img in body. */
export function removeDuplicateImages(html: string, featuredImage?: string | null): string {
  if (!featuredImage?.trim()) return html;

  let out = html;
  const imgRe = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  let removed = 0;

  out = out.replace(imgRe, (match, src: string) => {
    if (removed >= 2) return match;
    if (urlsMatch(src, featuredImage)) {
      removed++;
      return '';
    }
    return match;
  });

  return out;
}

/** Page hero already has H1 — drop duplicate title heading inside WP body. */
export function removeDuplicateTitleHeading(html: string, title: string): string {
  const plain = stripHtml(title).toLowerCase();
  if (!plain) return html;

  return html.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, (match, inner) => {
    const innerPlain = stripHtml(inner).toLowerCase();
    if (innerPlain === plain || innerPlain.includes(plain.slice(0, 24))) {
      return '';
    }
    return match;
  });
}

/**
 * Hero renders the page's single H1 — demote any remaining body H1 tags to H2.
 * Keeps one H1 per page (SEO best practice).
 */
export function demoteBodyH1ToH2(html: string): string {
  return html.replace(/<h1(\b[^>]*)>/gi, '<h2$1>').replace(/<\/h1>/gi, '</h2>');
}

/** Prevent skipped levels: bump orphan H4+ up until parent level exists in outline. */
export function fixHeadingLevelSkips(html: string): string {
  const re = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let lastLevel = 1; // page H1 lives in hero
  let out = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(html)) !== null) {
    out += html.slice(lastIndex, match.index);
    let level = Number(match[1]);
    const attrs = match[2];
    const inner = match[3];

    if (level === 1) level = 2;
    if (level > lastLevel + 1) level = lastLevel + 1;
    if (level > 6) level = 6;

    lastLevel = level;
    out += `<h${level}${attrs}>${inner}</h${level}>`;
    lastIndex = re.lastIndex;
  }

  out += html.slice(lastIndex);
  return out || html;
}

/** Constrain inline SVG icons (Elementor exports 512×512 icons with no width). */
export function constrainInlineSvgs(html: string): string {
  return html.replace(/<svg\b([^>]*)>/gi, (match, attrs: string) => {
    if (/\bwidth\s*=/.test(attrs) && /\bheight\s*=/.test(attrs)) {
      return match.replace(/class="/, 'class="wp-inline-svg ');
    }
    const cls = /\bclass="([^"]*)"/.exec(attrs);
    const classAttr = cls
      ? attrs.replace(/class="[^"]*"/, `class="wp-inline-svg ${cls[1]}"`)
      : `${attrs} class="wp-inline-svg"`;
    return `<svg${classAttr.replace(/\s+$/, '')} width="20" height="20" aria-hidden="true">`;
  });
}

const PREMIUM_ENQUIRY_CTA = `<div class="wp-premium-enquiry">
      <p class="wp-premium-enquiry-text">Speak with our admission counsellors for personalised guidance on fees, eligibility, and seat booking.</p>
      <div class="wp-premium-enquiry-actions">
        <a href="/contact" class="wp-premium-btn wp-premium-btn-primary">Book free counselling</a>
        <a href="tel:+917076909090" class="wp-premium-btn wp-premium-btn-outline">Call +91-7076909090</a>
      </div>
    </div>`;

/** Remove broken WP/Formidable/HTML forms site-wide → working CTA. */
export function replaceBrokenEmbeddedForms(html: string): string {
  let out = html;

  out = out.replace(/<h3[^>]*>\s*Book Your Consultation Now!\s*<\/h3>/gi, '');
  out = out.replace(/<h2[^>]*>\s*Book Your Consultation Now!\s*<\/h2>/gi, '');

  out = out.replace(/<div[^>]*\bfrm_forms\b[^>]*>[\s\S]*?<\/form>\s*<\/div>/gi, PREMIUM_ENQUIRY_CTA);
  out = out.replace(/<form[^>]*\bfrm-show-form\b[^>]*>[\s\S]*?<\/form>/gi, PREMIUM_ENQUIRY_CTA);
  out = out.replace(/<div[^>]*\bwpforms-container\b[^>]*>[\s\S]*?<\/form>\s*<\/div>/gi, PREMIUM_ENQUIRY_CTA);
  out = out.replace(/<form[^>]*\bwpforms-form\b[^>]*>[\s\S]*?<\/form>/gi, PREMIUM_ENQUIRY_CTA);
  out = out.replace(/<form[^>]*id="form_genralform"[^>]*>[\s\S]*?<\/form>/gi, PREMIUM_ENQUIRY_CTA);

  return out;
}

/** @deprecated Use replaceBrokenEmbeddedForms */
export function replaceBrokenWpForms(html: string): string {
  return replaceBrokenEmbeddedForms(html);
}

/** Convert Essential Addons accordion → native <details> (no giant +/- SVGs). */
export function transformEaelAccordions(html: string): string {
  const headerRe =
    /<div id="[^"]*" class="elementor-tab-title eael-accordion-header"[\s\S]*?<span class="eael-accordion-tab-title">([\s\S]*?)<\/span>[\s\S]*?<\/div>\s*<div id="[^"]*" class="eael-accordion-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;

  const items: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = headerRe.exec(html)) !== null) {
    const title = stripHtml(match[1]);
    const body = match[2].trim();
    const num = String(items.length + 1).padStart(2, '0');
    items.push(
      `<details class="wp-premium-faq" style="--faq-i:${items.length}">` +
        `<summary class="wp-premium-faq-summary">` +
        `<span class="wp-premium-faq-qnum">${num}</span>` +
        `<span class="wp-premium-faq-qtext">${escapeHtml(title)}</span>` +
        `</summary>` +
        `<div class="wp-premium-faq-body"><div class="wp-premium-faq-body-inner">${body}</div></div>` +
        `</details>`
    );
  }

  if (!items.length) return html;

  let out = html.replace(
    /<div class="eael-adv-accordion"[\s\S]*?<\/div>\s*(?=<\/div>\s*<\/div>)/i,
    `<div class="wp-premium-faq-group wp-premium-faq-group--animated">${items.join('')}</div>`
  );

  // If wrapper replace missed, append transformed block and hide raw accordion via class
  if (!out.includes('wp-premium-faq-group')) {
    out = out.replace(
      /<div class="eael-adv-accordion"[\s\S]*?<\/div>\s*<\/div>/i,
      `<div class="wp-premium-faq-group wp-premium-faq-group--animated">${items.join('')}</div>`
    );
  }

  return out;
}

/** Strip decorative icon-only spans that break without Elementor CSS. */
export function stripBrokenIconWidgets(html: string): string {
  let out = html;
  out = out.replace(/<span class="eael-advanced-accordion-icon-closed">[\s\S]*?<\/span>/gi, '');
  out = out.replace(/<span class="eael-advanced-accordion-icon-opened">[\s\S]*?<\/span>/gi, '');
  out = out.replace(/<svg[^>]*class="[^"]*fa-toggle[^"]*"[\s\S]*?<\/svg>/gi, '');
  out = out.replace(/<i aria-hidden="true" class="icon icon-[^"]*"><\/i>/gi, '');
  return out;
}

const MIN_GRID_LIST_ITEMS = 6;

/** Title + description in same <li> (e.g. Recognized Institution: Approved by NMC…) */
function isFeatureStyleList(inner: string): boolean {
  const liCount = (inner.match(/<li\b/gi) || []).length;
  if (liCount < 3 || liCount > 12) return false;
  const withTitleDesc = (
    inner.match(/<li\b[^>]*>[\s\S]*?<(?:b|strong)\b[^>]*>[\s\S]*?<\/(?:b|strong)>[\s\S]*?<span\b/gi) || []
  ).length;
  return withTitleDesc >= Math.min(3, liCount);
}

function addGridClassToListTag(tag: string, className: string): string {
  if (tag.includes(className)) return tag;
  if (/\bclass="/i.test(tag)) {
    return tag.replace(/\bclass="([^"]*)"/i, (_, cls) => `class="${cls} ${className}"`);
  }
  return tag.replace(/^<(ul|ol)\b/i, `<$1 class="${className}"`);
}

/** Long vertical lists → responsive chip grid (fills empty space, SEO-safe ul/li kept). */
export function transformLongListsToGrid(html: string): string {
  let out = html;

  out = out.replace(/<ul(\b[^>]*)>([\s\S]*?)<\/ul>/gi, (match, attrs, inner) => {
    if (match.includes('wp-premium-chip-grid') || match.includes('wp-premium-feature-grid')) {
      return match;
    }
    const liCount = (inner.match(/<li\b/gi) || []).length;
    if (isFeatureStyleList(inner)) {
      const openTag = addGridClassToListTag(`<ul${attrs}>`, 'wp-premium-feature-grid');
      return `${openTag}${inner}</ul>`;
    }
    if (liCount < MIN_GRID_LIST_ITEMS) return match;
    const isIconList = /elementor-icon-list-items/i.test(attrs);
    const gridClass = isIconList
      ? 'wp-premium-chip-grid wp-premium-icon-chip-grid'
      : 'wp-premium-chip-grid';
    const openTag = addGridClassToListTag(`<ul${attrs}>`, gridClass);
    return `${openTag}${inner}</ul>`;
  });

  out = out.replace(/<ol(\b[^>]*)>([\s\S]*?)<\/ol>/gi, (match, attrs, inner) => {
    if (match.includes('wp-premium-chip-grid') || match.includes('wp-premium-feature-grid')) {
      return match;
    }
    const liCount = (inner.match(/<li\b/gi) || []).length;
    if (isFeatureStyleList(inner)) {
      const openTag = addGridClassToListTag(`<ol${attrs}>`, 'wp-premium-feature-grid');
      return `${openTag}${inner}</ol>`;
    }
    if (liCount < MIN_GRID_LIST_ITEMS) return match;
    const openTag = addGridClassToListTag(`<ol${attrs}>`, 'wp-premium-chip-grid');
    return `${openTag}${inner}</ol>`;
  });

  return out;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type FaqItem = { num: string; question: string; answer: string };

const FAQ_ANSWER_PREFIX = /(?:A\s*\d+\s*[.:]|A\s*:|Ans\.?\s*|Answer\s*:)/i;

function buildFaqDetailsHtml(items: FaqItem[]): string {
  return items
    .map(
      (item, i) =>
        `<details class="wp-premium-faq" style="--faq-i:${i}">` +
        `<summary class="wp-premium-faq-summary">` +
        `<span class="wp-premium-faq-qnum">${item.num.padStart(2, '0')}</span>` +
        `<span class="wp-premium-faq-qtext">${escapeHtml(item.question)}</span>` +
        `</summary>` +
        `<div class="wp-premium-faq-body"><div class="wp-premium-faq-body-inner">${item.answer}</div></div>` +
        `</details>`
    )
    .join('');
}

function isSkippableParagraph(inner: string): boolean {
  const t = inner.trim();
  if (!t || t === '&nbsp;') return true;
  if (/^<style\b/i.test(t)) return true;
  if (stripHtml(t).length === 0) return true;
  return false;
}

function extractParagraphs(html: string): string[] {
  const paras: string[] = [];
  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (!isSkippableParagraph(m[1])) paras.push(m[1].trim());
  }
  return paras;
}

function cleanAnswerHtml(inner: string): string {
  let out = inner.trim();
  out = out.replace(/^(?:<b>\s*)?(?:A\s*\d+\s*[.:]|A\s*:|Ans\.?\s*|Answer\s*:)\s*<\/b>\s*/i, '');
  out = out.replace(/^(?:<span[^>]*>\s*)?(?:A\s*\d+\s*[.:]|A\s*:|Ans\.?\s*|Answer\s*:)\s*/i, (match) => {
    const spanOpen = inner.match(/^<span[^>]*>/i)?.[0];
    return spanOpen && match.length < 20 ? spanOpen : '';
  });
  out = out.replace(/^(?:A\s*\d+\s*[.:]|A\s*:|Ans\.?\s*|Answer\s*:)\s*/i, '');
  out = out.replace(/^<\/b>\s*/i, '');
  return out.trim();
}

function parseSameParagraphQa(inner: string): FaqItem | null {
  if (!/Q\s*\d+\s*[.:]/i.test(inner)) return null;
  const parts = inner.split(/<br\s*\/?>/i);
  if (parts.length < 2) return null;
  const qPart = parts[0];
  const aPart = parts.slice(1).join(' ');
  const num = (qPart.match(/Q\s*(\d+)/i) ?? [])[1];
  const question = stripHtml(qPart).replace(/^Q\s*\d+\s*[.:]\s*/i, '').trim();
  const answer = cleanAnswerHtml(aPart);
  if (!num || !question || !answer) return null;
  return { num, question, answer };
}

function parseQuestionParagraph(inner: string): { num: string; question: string; inlineAnswer?: string } | null {
  const text = stripHtml(inner);
  const qOnly = text.match(/^Q\s*(\d+)\s*[.:]\s*(.+)$/i);
  if (qOnly && !FAQ_ANSWER_PREFIX.test(text.slice(0, 80))) {
    const inline = inner.match(
      /Q\s*\d+\s*[.:][\s\S]*?(?:<br\s*\/?>\s*)+(?:<b>\s*)?(?:A\s*\d+\s*[.:]|A\s*:|Ans\.?\s*)([\s\S]*)$/i
    );
    if (inline) {
      return { num: qOnly[1], question: qOnly[2].trim(), inlineAnswer: cleanAnswerHtml(inline[1]) };
    }
    return { num: qOnly[1], question: qOnly[2].trim() };
  }

  const combined = inner.match(
    /Q\s*(\d+)\s*[.:]\s*([\s\S]*?)(?:<br\s*\/?>\s*)+(?:<b>\s*)?(?:A\s*\d+\s*[.:]|A\s*:|Ans\.?\s*)([\s\S]*)$/i
  );
  if (combined) {
    return {
      num: combined[1],
      question: stripHtml(combined[2]).trim(),
      inlineAnswer: cleanAnswerHtml(combined[3]),
    };
  }
  return null;
}

function isAnswerParagraph(inner: string): boolean {
  if (/Q\s*\d+\s*[.:]/i.test(inner) && !FAQ_ANSWER_PREFIX.test(inner)) return false;
  const text = stripHtml(inner);
  if (/^Q\s*\d+\s*[.:]/i.test(text)) return false;
  return text.length > 0;
}

function parseFaqItemsFromHtml(block: string): FaqItem[] {
  const items: FaqItem[] = [];

  const h2Blocks = [
    ...block.matchAll(
      /<h([23])[^>]*>([\s\S]*?Q\s*\d+\s*[.:][\s\S]*?)<\/h\1>\s*(<p[^>]*>[\s\S]*?<\/p>)/gi
    ),
  ];
  if (h2Blocks.length >= 2) {
    for (const m of h2Blocks) {
      const q = parseQuestionParagraph(m[2]) ?? {
        num: (m[2].match(/Q\s*(\d+)/i) ?? [])[1] ?? String(items.length + 1),
        question: stripHtml(m[2]).replace(/^Q\s*\d+\s*[.:]\s*/i, '').trim(),
      };
      const answer = cleanAnswerHtml(m[3].replace(/^<p[^>]*>|<\/p>$/gi, ''));
      if (q.question && answer) {
        items.push({ num: q.num, question: q.question, answer });
      }
    }
    if (items.length >= 2) return items;
  }

  const paras = extractParagraphs(block);
  let i = 0;
  while (i < paras.length) {
    const same = parseSameParagraphQa(paras[i]);
    if (same) {
      items.push(same);
      i += 1;
      continue;
    }

    const q = parseQuestionParagraph(paras[i]);
    if (!q) {
      i += 1;
      continue;
    }

    if (q.inlineAnswer) {
      items.push({ num: q.num, question: q.question, answer: q.inlineAnswer });
      i += 1;
      continue;
    }

    let answer: string | null = null;
    let j = i + 1;
    while (j < paras.length) {
      if (parseQuestionParagraph(paras[j])) break;
      if (isAnswerParagraph(paras[j])) {
        answer = cleanAnswerHtml(paras[j]);
        i = j + 1;
        break;
      }
      j += 1;
    }
    if (!answer) {
      i += 1;
      continue;
    }
    items.push({ num: q.num, question: q.question, answer });
  }

  return items;
}

function wrapFaqGroup(items: FaqItem[], heading?: string): string {
  if (!items.length) return heading ?? '';
  const titledHeading = heading
    ? heading.replace(/<h([23])\b/i, '<h$1 class="wp-faq-section-title"')
    : '<h2 class="wp-faq-section-title">FAQs</h2>';
  return `${titledHeading}<div class="wp-premium-faq-group wp-premium-faq-group--animated">${buildFaqDetailsHtml(items)}</div>`;
}

/** Yoast SEO FAQ blocks → premium accordion. */
export function transformSchemaFaqBlocks(html: string): string {
  if (!html.includes('schema-faq-section')) return html;

  return html.replace(
    /<div class="schema-faq[^"]*"[^>]*>([\s\S]*?)<\/div>(?=\s*(?:<\/div>|<\/section>|$))/gi,
    (full, inner) => {
      const items = parseSchemaFaqSections(inner);
      if (!items.length) return full;
      return `<div class="wp-premium-faq-group wp-premium-faq-group--animated">${buildFaqDetailsHtml(items)}</div>`;
    }
  );
}

function parseSchemaFaqSections(inner: string): FaqItem[] {
  const items: FaqItem[] = [];
  const re =
    /schema-faq-section[\s\S]*?schema-faq-question[\s\S]*?>([\s\S]*?)<\/strong>\s*<p class="schema-faq-answer"[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner)) !== null) {
    const question = stripHtml(m[1]).replace(/^Q\s*\d+\s*[.:]\s*/i, '').trim();
    const answer = cleanAnswerHtml(m[2]);
    if (question && answer) {
      items.push({ num: String(items.length + 1), question, answer });
    }
  }
  return items;
}

/** Essential Blocks accordion → premium FAQ UI. */
export function transformEbAccordions(html: string): string {
  if (!html.includes('essential-blocks-accordion')) return html;

  return html.replace(
    /<div class="wp-block-essential-blocks-accordion[^"]*"[\s\S]*?<div class="eb-accordion-inner">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi,
    (full, inner) => {
      const items: FaqItem[] = [];
      const itemRe =
        /eb-accordion-title[^>]*>([\s\S]*?)<\/h3>[\s\S]*?class="eb-accordion-content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
      let m: RegExpExecArray | null;
      while ((m = itemRe.exec(inner)) !== null) {
        const question = stripHtml(m[1]).trim();
        const answer = m[2].trim();
        if (question && stripHtml(answer).length > 0) {
          items.push({ num: String(items.length + 1), question, answer });
        }
      }
      if (items.length < 1) return full;
      return `<div class="wp-premium-faq-group wp-premium-faq-group--animated">${buildFaqDetailsHtml(items)}</div>`;
    }
  );
}

/** WP Smart Accordion (wpsm) → same premium FAQ UI. */
export function transformWpsmAccordions(html: string): string {
  const accordionRe = /<div[^>]*\bwpsm_accordion_\d+[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi;
  return html.replace(accordionRe, (block) => {
    const titles = [...block.matchAll(/class="[^"]*ac_title_class"[^>]*>([\s\S]*?)<\/a>/gi)].map(
      (m) => stripHtml(m[1]).trim()
    );
    const bodies = [...block.matchAll(/class="wpsm_panel-body"[^>]*>([\s\S]*?)<\/div>\s*(?=<\/div>)/gi)].map(
      (m) => m[1].trim()
    );
    if (!titles.length || !bodies.length) return block;

    const items: FaqItem[] = titles.map((title, idx) => ({
      num: String(idx + 1),
      question: title,
      answer: bodies[idx] ?? bodies[bodies.length - 1] ?? '',
    }));

    return `<div class="wp-premium-faq-group wp-premium-faq-group--animated">${buildFaqDetailsHtml(items)}</div>`;
  });
}

/** All FAQ blocks under "FAQs" heading → animated accordion (transforms in place, no content copy). */
export function transformWpFaqParagraphs(html: string): string {
  return html.replace(
    /(<h[23][^>]*>[\s\S]*?\bFAQs?\b[\s\S]*?<\/h[23]>)(\s*)([\s\S]*?)(?=<div class="xs_social|<\/section>|<section\b|$)/gi,
    (full, heading, _sp, body) => {
      if (body.includes('wp-premium-faq-group')) return full;
      const items = parseFaqItemsFromHtml(body);
      if (!items.length) return full;
      return wrapFaqGroup(items, heading);
    }
  );
}

/** Retry FAQ sections that still show raw Q/A after first pass. */
function transformRemainingFaqSections(html: string): string {
  return html.replace(
    /(<h[23][^>]*>[\s\S]*?\bFAQs?\b[\s\S]*?<\/h[23]>)(\s*)([\s\S]*?)(?=<div class="xs_social|<\/section>|<section\b|$)/gi,
    (full, heading, _sp, body) => {
      if (!/<p[^>]*>[\s\S]*?Q\s*\d+\s*[.:]/i.test(body) || body.includes('wp-premium-faq-group')) {
        return full;
      }
      const items = parseFaqItemsFromHtml(body);
      if (!items.length) return full;
      return wrapFaqGroup(items, heading);
    }
  );
}

/** Every FAQ format on pages & blogs → one animated accordion system. */
export function transformAllFaqs(html: string): string {
  let out = html;
  out = transformSchemaFaqBlocks(out);
  out = transformEbAccordions(out);
  out = transformWpsmAccordions(out);
  out = transformWpFaqParagraphs(out);
  out = transformRemainingFaqSections(out);
  return out;
}

export function prepareWpHtml(
  html: string,
  options?: { featuredImage?: string | null; title?: string }
): string {
  let out = html;
  if (options?.featuredImage) out = removeDuplicateImages(out, options.featuredImage);
  if (options?.title) out = removeDuplicateTitleHeading(out, options.title);
  out = demoteBodyH1ToH2(out);
  out = fixHeadingLevelSkips(out);
  out = stripBrokenIconWidgets(out);
  out = transformLongListsToGrid(out);
  out = transformEaelAccordions(out);
  out = transformAllFaqs(out);
  out = replaceBrokenEmbeddedForms(out);
  out = constrainInlineSvgs(out);
  return out;
}

export function plainTitle(title: string): string {
  return stripHtml(title);
}

export function metaDescriptionFromContent(
  excerpt: string | null | undefined,
  content: string,
  max = 160
): string {
  const base = stripHtml(excerpt || content);
  if (base.length <= max) return base;
  return `${base.slice(0, max - 1).trim()}…`;
}
