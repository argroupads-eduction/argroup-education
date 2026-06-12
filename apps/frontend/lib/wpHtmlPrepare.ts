/** Prepare migrated WordPress HTML for premium display (content unchanged semantically). */

import { CONTACT_INFO } from '@/lib/constants';
import { injectMbbsAbroadCountryImages } from '@/lib/mbbsAbroadCountryImages';
import { injectMbbsIndiaStateImages } from '@/lib/mbbsIndiaStateImages';
import { plainTextFromHtml } from '@/lib/decodeHtmlEntities';
import { rewriteInternalLinks } from '@/lib/rewriteInternalLinks';
import { injectCollegeCardImagesInHtml } from '@/lib/injectCollegeCardImages';
import { normalizeContentImagesInHtml } from '@/lib/normalizeContentImages';
import { rewriteWpMediaUrlsInHtml } from '@/lib/wpMediaUrl';

function normUrl(url: string): string {
  return url
    .replace(/^https?:\/\/(www\.)?argroupofeducation\.com/i, '')
    .replace(/^\/api\/wp-media\//i, '/wp-content/')
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
  return plainTextFromHtml(text);
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

  re.lastIndex = 0;
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
        <a href="/contact" class="wp-premium-btn wp-premium-btn-primary">Book expert counselling</a>
        <a href="tel:${CONTACT_INFO.phoneTel}" class="wp-premium-btn wp-premium-btn-outline">Call ${CONTACT_INFO.phone}</a>
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

function parseEaelAccordionItems(block: string): FaqItem[] {
  const headerRe =
    /<div id="[^"]*" class="elementor-tab-title eael-accordion-header"[\s\S]*?<span class="eael-accordion-tab-title">([\s\S]*?)<\/span>[\s\S]*?<\/div>\s*<div id="[^"]*" class="eael-accordion-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;

  const items: FaqItem[] = [];
  let match: RegExpExecArray | null;
  headerRe.lastIndex = 0;
  while ((match = headerRe.exec(block)) !== null) {
    const question = stripHtml(match[1]).trim();
    const answer = match[2].trim();
    if (!question || !stripHtml(answer)) continue;
    items.push({ num: String(items.length + 1), question, answer });
  }
  return items;
}

/** Convert Essential Addons accordion → native <details> (no giant +/- SVGs). */
export function transformEaelAccordions(html: string): string {
  if (!html.includes('eael-adv-accordion')) return html;

  let out = html;
  const marker = 'eael-adv-accordion';
  let searchFrom = 0;

  while (searchFrom < out.length) {
    const accIdx = out.indexOf(marker, searchFrom);
    if (accIdx === -1) break;

    const accOpen = out.lastIndexOf('<div', accIdx);
    if (accOpen === -1) {
      searchFrom = accIdx + marker.length;
      continue;
    }

    const blockEnd = findClosingDiv(out, accOpen);
    if (blockEnd === -1) {
      searchFrom = accIdx + marker.length;
      continue;
    }

    const block = out.slice(accOpen, blockEnd);
    const items = parseEaelAccordionItems(block);
    if (!items.length) {
      searchFrom = accIdx + marker.length;
      continue;
    }

    const replacement = `<div class="wp-premium-faq-group wp-premium-faq-group--animated">${buildFaqDetailsHtml(items)}</div>`;
    out = out.slice(0, accOpen) + replacement + out.slice(blockEnd);
    searchFrom = accOpen + replacement.length;
  }

  return out;
}

/** Remove Elementor sections hidden on all breakpoints (duplicate tables / junk). */
export function stripElementorHiddenSections(html: string): string {
  return html.replace(
    /<section\b[^>]*\belementor-hidden-desktop\b[^>]*\belementor-hidden-tablet\b[^>]*\belementor-hidden-mobile\b[^>]*>[\s\S]*?<\/section>/gi,
    ''
  );
}

function tableCellPlainText(cellHtml: string): string {
  return stripHtml(cellHtml).replace(/\s+/g, ' ').trim();
}

/** Broken WP/Elementor table artifacts (e.g. "-[", lone dashes). */
function isJunkTableCellText(text: string): boolean {
  if (!text) return true;
  const t = text.trim();
  if (!t) return true;
  if (t === '-[' || /^-\[\s]*$/.test(t)) return true;
  if (t === '-' || t === '–' || t === '—' || t === '−') return true;
  if (/^[-–—_[\](){}.,;:!?…•·|\\/\s]+$/u.test(t)) return true;
  return false;
}

/** Drop junk table rows migrated from WordPress (empty, "-[", lone dash cells). */
export function cleanBrokenTableRows(html: string): string {
  return html.replace(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi, (row, inner) => {
    const cells = [...inner.matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)];
    if (!cells.length) return row;
    const texts = cells.map((m) => tableCellPlainText(m[1] ?? ''));
    if (texts.every(isJunkTableCellText)) return '';
    if (texts.some((t) => t === '-[' || /^-\[\s]*$/.test(t))) return '';
    return row;
  });
}

/** College card titles must not be h2 — wrapContentSections splits on h2 and breaks image grids. */
export function demoteJkitCardTitles(html: string): string {
  return html.replace(/<h2(\b[^>]*\bbody-title\b[^>]*)>([\s\S]*?)<\/h2>/gi, '<p$1>$2</p>');
}

/** Demote h2 → h3 inside multi-column card tiles (col-33/50 etc.) so lazy sections don't split per college. */
export function demoteMultiColumnCardHeadings(html: string): string {
  return html.replace(
    /<div class="[^"]*elementor-column elementor-col-(?!100\b)[^"]*"[^>]*>([\s\S]*?)<\/div>(?=\s*(?:<div class="[^"]*elementor-column|<\/div>))/gi,
    (columnBlock) =>
      columnBlock.replace(/<h2(\b[^>]*)>([\s\S]*?)<\/h2>/gi, '<h3$1>$2</h3>')
  );
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
const PARAGRAPH_LIST_MIN_CHARS = 72;

/**
 * WP/Elementor often exports `<li><span>text</span><span><br /></span></li>`.
 * Chip cards use flex row — sibling spans become narrow columns and break words vertically.
 */
function flattenNestedSpans(html: string): string {
  let out = html;
  for (let i = 0; i < 6 && /<span\b[^>]*>\s*<span\b/i.test(out); i += 1) {
    out = out.replace(
      /<span\b[^>]*>\s*(<span\b[^>]*>[\s\S]*?<\/span>)\s*<\/span>/gi,
      '$1'
    );
  }
  return out;
}

function extractElementorIconListText(inner: string): string | null {
  const textMatch = inner.match(/<span class="elementor-icon-list-text"[^>]*>([\s\S]*?)<\/span>/i);
  if (textMatch) return textMatch[1].trim();

  const iconMatch = inner.match(/<span class="elementor-icon-list-icon"[^>]*>([\s\S]*?)<\/span>/i);
  if (!iconMatch) return null;
  const text = iconMatch[1]
    .replace(/<i\b[^>]*>[\s\S]*?<\/i>/gi, '')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, '')
    .trim();
  return text || null;
}

/** Elementor icon rows must keep icon + text spans separate (chip grid hides icon spans). */
export function normalizeElementorIconListItems(html: string): string {
  return html.replace(/<li(\b[^>]*elementor-icon-list-item[^>]*)>([\s\S]*?)<\/li>/gi, (match, attrs, inner) => {
    if (/elementor-icon-list-text/i.test(inner)) return match;

    const text = extractElementorIconListText(inner);
    if (!text) return match;

    const iconMatch = inner.match(/(?:<i\b[^>]*>[\s\S]*?<\/i>|<svg\b[\s\S]*?<\/svg>)/i);
    const iconHtml = iconMatch ? iconMatch[0] : '';

    return (
      `<li${attrs}>` +
      (iconHtml ? `<span class="elementor-icon-list-icon">${iconHtml}</span>` : '') +
      `<span class="elementor-icon-list-text">${text}</span></li>`
    );
  });
}

/** Strip decorative icons from feature cards; split "Title: body" into bold title + text. */
function simplifyFeatureGridIconLists(html: string): string {
  return html.replace(
    /(<ul[^>]*wp-premium-feature-grid[^>]*>)([\s\S]*?)(<\/ul>)/gi,
    (_full, open: string, inner: string, close: string) => {
      const fixed = inner.replace(
        /<li(\b[^>]*)>([\s\S]*?)<\/li>/gi,
        (liMatch: string, attrs: string, liInner: string) => {
          const text = extractElementorIconListText(liInner) || stripHtml(liInner).trim();
          if (!text) return liMatch;

          const colonMatch = text.match(/^([^:]{3,48}):\s*(.+)$/);
          if (colonMatch) {
            return `<li${attrs}><strong>${escapeHtml(colonMatch[1])}:</strong> ${escapeHtml(colonMatch[2])}</li>`;
          }

          if (/elementor-icon-list-item/i.test(attrs) || /elementor-icon-list-icon/i.test(liInner)) {
            return `<li${attrs}>${escapeHtml(text)}</li>`;
          }
          return liMatch;
        }
      );
      return `${open}${fixed}${close}`;
    }
  );
}

/** Numbered chip grids only need document labels — drop decorative icon markup. */
function simplifyIconChipGridLists(html: string): string {
  return html.replace(
    /(<ul[^>]*wp-premium-icon-chip-grid[^>]*>)([\s\S]*?)(<\/ul>)/gi,
    (_full, open, inner, close) => {
      const fixed = inner.replace(/<li(\b[^>]*)>([\s\S]*?)<\/li>/gi, (liMatch: string, attrs: string, liInner: string) => {
        const text = extractElementorIconListText(liInner);
        if (!text) return liMatch;
        return `<li${attrs}><span class="elementor-icon-list-text">${text}</span></li>`;
      });
      return `${open}${fixed}${close}`;
    }
  );
}

const CTA_CONTACT_LABEL_RE =
  /Get\s+Consultation|Book\s+(?:Your\s+)?Consultation(?:\s+Now)?|Expert\s+Counsell?ing|Book\s+expert\s+counsell?ing/i;

function isAddressPlainText(text: string): boolean {
  return /\b(floor|tower|noida|sec-|wave silver|201301|pin\s*code|uttar pradesh)\b/i.test(text);
}

function contactHrefForPlainText(text: string): string {
  const t = text.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return `mailto:${t}`;
  if (
    /\b(floor|tower|noida|sec-|road|street|avenue|pincode|pin\s*code|up-|delhi|india|address)\b/i.test(
      t
    ) ||
    /\d{1,4},\s*\d/.test(t)
  ) {
    return '/contact';
  }
  const digits = t.replace(/[^\d+]/g, '');
  if (/^\+?\d{10,13}$/.test(digits) && !/\s/.test(t.replace(/[\d+\-()]/g, ''))) {
    return `tel:${digits}`;
  }
  return '/contact';
}

const GRID_LIST_CLASS_RE =
  /\bwp-premium-(?:steps-list|chip-grid|feature-grid|icon-chip-grid)(?:\s+\S+)?/g;

function enhanceIconListItems(inner: string, linkify = false): string {
  return inner.replace(/<li(\b[^>]*elementor-icon-list-item[^>]*)>([\s\S]*?)<\/li>/gi, (liMatch, attrs, liInner) => {
    const text = extractElementorIconListText(liInner);
    if (!text) return liMatch;

    const iconMatch = liInner.match(/<span class="elementor-icon-list-icon"[^>]*>[\s\S]*?<\/span>/i);
    const iconHtml = iconMatch ? iconMatch[0] : '';

    if (linkify) {
      const href = contactHrefForPlainText(text);
      let liAttrs = attrs;
      if (/\bclass="/i.test(liAttrs)) {
        liAttrs = liAttrs.replace(/\bclass="([^"]*)"/i, (_: string, c: string) => `class="${c} wp-contact-card"`);
      } else {
        liAttrs = `${liAttrs} class="wp-contact-card"`;
      }
      return (
        `<li${liAttrs}>` +
        `${iconHtml}` +
        `<a class="elementor-icon-list-text wp-contact-card-link" href="${href}">${text}</a></li>`
      );
    }

    return `<li${attrs}>${iconHtml}<span class="elementor-icon-list-text">${text}</span></li>`;
  });
}

/** Mark image + CTA | copy/table 50/50 containers for layout CSS. */
export function markEditorialSplitContainers(html: string): string {
  return html.replace(/<div class="([^"]*\belementor-container\b[^"]*)">/gi, (match, cls, offset) => {
    if (cls.includes('wp-editorial-split')) return match;
    const slice = html.slice(offset, offset + 4500);
    if (!/\belementor-col-50\b/.test(slice)) return match;
    const hasImageCta = /elementor-widget-image[\s\S]{0,2500}elementor-widget-button/i.test(slice);
    const hasImageTable =
      /elementor-widget-image[\s\S]{0,4500}elementor-widget-eael-data-table|elementor-widget-image[\s\S]{0,4500}eael-data-table-wrap/i.test(
        slice
      );
    if (!hasImageCta && !hasImageTable) return match;
    return `<div class="${cls} wp-editorial-split">`;
  });
}

/** Inner HTML of a top-level section (stops at its own closing tag). */
function topLevelSectionInner(html: string, sectionOpenOffset: number): string {
  const tagEnd = html.indexOf('>', sectionOpenOffset);
  if (tagEnd === -1) return '';
  const start = tagEnd + 1;
  let depth = 1;
  let i = start;
  while (i < html.length && depth > 0) {
    const nextOpen = html.toLowerCase().indexOf('<section', i);
    const nextClose = html.toLowerCase().indexOf('</section>', i);
    if (nextClose === -1) return html.slice(start, Math.min(start + 3000, html.length));
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 8;
    } else {
      depth--;
      if (depth === 0) return html.slice(start, nextClose);
      i = nextClose + 10;
    }
  }
  return html.slice(start, Math.min(start + 3000, html.length));
}

/** Extract direct elementor-col-33 top-column blocks from a section inner. */
function extractTopCol33Columns(inner: string): string[] {
  const cols: string[] = [];
  const re = /<div\b[^>]*\belementor-column\b[^>]*\belementor-col-33\b[^>]*\belementor-top-column\b[^>]*>/gi;
  let m;
  while ((m = re.exec(inner)) !== null) {
    const start = m.index;
    let depth = 0;
    let i = start;
    while (i < inner.length) {
      const open = inner.indexOf('<div', i);
      const close = inner.indexOf('</div>', i);
      if (close === -1) break;
      if (open !== -1 && open < close) {
        depth++;
        i = open + 4;
      } else {
        depth--;
        i = close + 6;
        if (depth === 0) {
          cols.push(inner.slice(start, i));
          break;
        }
      }
    }
  }
  return cols;
}

function isCollegeCardSectionInner(inner: string): boolean {
  if (!/\bjkit-image-box\b|\belementor-widget-jkit_image_box\b/i.test(inner)) return false;
  if (/\beael-data-table-wrap\b|\belementor-widget-eael-data-table\b/i.test(inner)) return false;
  if (/\belementor-col-50\b|\belementor-col-66\b|\belementor-col-100\b/.test(inner)) return false;
  if (!/\belementor-col-33\b/.test(inner)) return false;
  if (/MBBS\s+IN/i.test(inner) && /elementor-widget-image[\s\S]{0,2500}elementor-widget-heading/i.test(inner)) {
    return false;
  }
  return extractTopCol33Columns(inner).length > 0;
}

function addClassToTag(tag: string, className: string): string {
  const classAttr = tag.match(/\bclass\s*=\s*["']([^"']*)["']/i);
  if (classAttr) {
    if (classAttr[1].includes(className)) return tag;
    const next = `${classAttr[1]} ${className}`.trim();
    return tag.replace(classAttr[0], `class="${next}"`);
  }
  return tag.replace(/>$/, ` class="${className}">`);
}

/** Merge consecutive jkit college card rows into one aligned 3-column grid. */
export function mergeCollegeCardGridSections(html: string): string {
  type SectionSlice = { start: number; end: number; openTag: string; inner: string; isCollege: boolean };
  const slices: SectionSlice[] = [];
  const re = /<section\b([^>]*\belementor-top-section\b[^>]*)>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const start = m.index;
    const openTag = m[0];
    const inner = topLevelSectionInner(html, start);
    const closeIdx = html.toLowerCase().indexOf('</section>', start);
    if (closeIdx === -1) continue;
    const end = closeIdx + '</section>'.length;
    slices.push({
      start,
      end,
      openTag,
      inner,
      isCollege: isCollegeCardSectionInner(inner),
    });
  }
  if (slices.length < 2) return html;

  const removals: Array<{ start: number; end: number }> = [];
  const replacements: Array<{ start: number; end: number; text: string }> = [];

  let i = 0;
  while (i < slices.length) {
    if (!slices[i].isCollege) {
      i++;
      continue;
    }
    let j = i;
    while (j < slices.length && slices[j].isCollege) j++;
    const run = slices.slice(i, j);
    const allCols = run.flatMap((s) => extractTopCol33Columns(s.inner));
    const first = run[0];
    const containerRe = /(<div class="[^"]*\belementor-container\b[^"]*)">([\s\S]*)(<\/div>\s*)$/i;
    const containerMatch = first.inner.match(containerRe);
    if (!containerMatch || allCols.length === 0) {
      i = j;
      continue;
    }

    const mergedContainerOpen = addClassToTag(`${containerMatch[1]}>`, 'wp-college-card-grid');
    const mergedInner = `${mergedContainerOpen}${allCols.join('\n')}${containerMatch[3]}`;
    const mergedOpenTag = addClassToTag(first.openTag, 'wp-college-card-grid-section');
    const mergedSection = `${mergedOpenTag}${mergedInner}</section>`;

    replacements.push({ start: first.start, end: first.end, text: mergedSection });
    for (let k = 1; k < run.length; k++) {
      removals.push({ start: run[k].start, end: run[k].end });
    }
    i = j;
  }

  if (replacements.length === 0) return html;

  const ops = [
    ...replacements.map((r) => ({ ...r, kind: 'replace' as const })),
    ...removals.map((r) => ({ ...r, kind: 'remove' as const, text: '' })),
  ].sort((a, b) => b.start - a.start);

  let out = html;
  for (const op of ops) {
    out = out.slice(0, op.start) + (op.kind === 'replace' ? op.text : '') + out.slice(op.end);
  }
  return out;
}

/** MBBS India state tile rows (col-33 landmark cards). */
export function markMbbsStateGridSections(html: string): string {
  return html.replace(/<section\b([^>]*)>/gi, (match, attrs, offset) => {
    if (/\bwp-mbbs-state-grid\b/.test(attrs)) return match;
    const inner = topLevelSectionInner(html, offset);
    if (!/\belementor-col-33\b/.test(inner)) return match;
    if ((inner.match(/\belementor-col-33\b/g) || []).length < 2) return match;
    if (!/mbbs-in-[a-z0-9-]+/i.test(inner)) return match;
    if (!/MBBS\s+IN/i.test(inner)) return match;
    if (!/elementor-widget-image[\s\S]{0,3500}elementor-widget-heading/i.test(inner)) return match;

    const classAttr = attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i);
    if (classAttr) {
      const next = `${classAttr[1]} wp-mbbs-state-grid`.trim();
      return match.replace(classAttr[0], `class="${next}"`);
    }
    return `<section${attrs} class="wp-mbbs-state-grid">`;
  });
}

/** 50/50 splits where the first column is only spacer — collapse to single column. */
export function markCollapsedSpacerSplits(html: string): string {
  return html.replace(/<div class="([^"]*\belementor-container\b[^"]*)">/gi, (match, cls, offset) => {
    if (cls.includes('wp-split-collapsed')) return match;
    const slice = html.slice(offset, offset + 5000);
    if (!/\belementor-col-50\b/.test(slice)) return match;
    const spacerOnlyLead =
      /elementor-col-50[\s\S]{0,2200}elementor-widget-spacer[\s\S]{0,800}<\/div>\s*<\/div>\s*<\/div>\s*<div[^>]*elementor-col-50/i.test(
        slice
      );
    if (!spacerOnlyLead) return match;
    return `<div class="${cls} wp-split-collapsed">`;
  });
}

/** Remove EAEL tables with blank header cells (college fact rows use tbody only). */
export function stripEmptyEaelTableHeadings(html: string): string {
  return html.replace(/<thead>[\s\S]*?<\/thead>/gi, (match) => {
    if (stripHtml(match).trim()) return match;
    return '';
  });
}

const ESTABLISHMENT_LABEL_RE = /^(?:year\s+of\s+)?establishment$/i;

function normalizeEstablishmentLabelText(label: string): string | null {
  if (ESTABLISHMENT_LABEL_RE.test(label.trim())) return 'Established';
  return null;
}

function replaceFirstCellLabel(cellHtml: string, nextLabel: string): string {
  if (/<div class="td-content">/i.test(cellHtml)) {
    return cellHtml.replace(/(<div class="td-content">)[\s\S]*?(<\/div>)/i, `$1${nextLabel}$2`);
  }
  return cellHtml.replace(/(<td\b[^>]*>)[\s\S]*?(<\/td>)/i, `$1${nextLabel}$2`);
}

/** Standardise founding-year labels in EAEL key-value tables (Establishment → Established). */
export function normalizeEstablishmentFactLabels(html: string): string {
  return html.replace(/<table\b[^>]*\beael-data-table\b[\s\S]*?<\/table>/gi, (table) =>
    table.replace(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi, (row, inner) => {
      const cells = [...inner.matchAll(/<td\b[^>]*>[\s\S]*?<\/td>/gi)];
      if (cells.length < 2) return row;

      const label = tableCellPlainText(cells[0][0]);
      const nextLabel = normalizeEstablishmentLabelText(label);
      if (!nextLabel) return row;

      return `<tr>${replaceFirstCellLabel(cells[0][0], nextLabel)}${cells
        .slice(1)
        .map((cell) => cell[0])
        .join('')}</tr>`;
    })
  );
}

/** Fix EAEL rows exported with extra empty cells (common on college/state pages). */
export function normalizeEaelFactTableRows(html: string): string {
  return html.replace(/<table\b[^>]*\beael-data-table\b[\s\S]*?<\/table>/gi, (table) =>
    table.replace(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi, (row, inner) => {
      const cells = [...inner.matchAll(/<td\b[^>]*>[\s\S]*?<\/td>/gi)];
      const texts = cells.map((cell) => tableCellPlainText(cell[0]));

      if (cells.length === 4 && !texts[2] && !texts[3]) {
        return `<tr>${cells[0][0]}${cells[1][0]}</tr>`;
      }

      if (cells.length === 4 && texts[0] && texts[2] && !texts[1] && !texts[3]) {
        return `<tr>${cells[0][0]}${cells[2][0]}</tr>`;
      }

      if (cells.length === 4 && texts[0] && !texts[1] && !texts[2] && texts[3]) {
        return `<tr>${cells[0][0]}${cells[3][0]}</tr>`;
      }

      if (cells.length === 3 && texts[0] && !texts[1] && texts[2]) {
        return `<tr>${cells[0][0]}${cells[2][0]}</tr>`;
      }

      return row;
    })
  );
}

/** University profile blocks: image (+ optional CTA) | EAEL facts table. */
export function markUniversityProfileSections(html: string): string {
  let out = html.replace(/<section\b([^>]*\belementor-inner-section\b[^>]*)>/gi, (match, attrs, offset) => {
    if (/\bwp-university-profile\b/.test(attrs)) return match;
    const slice = html.slice(offset, offset + 9000);
    if (!/\belementor-col-50\b/.test(slice)) return match;
    if (!/elementor-widget-image/i.test(slice)) return match;
    if (!/elementor-widget-eael-data-table|eael-data-table-wrap/i.test(slice)) return match;

    const classAttr = attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i);
    if (classAttr) {
      const next = `${classAttr[1]} wp-university-profile`.trim();
      return match.replace(classAttr[0], `class="${next}"`);
    }
    return `<section${attrs} class="wp-university-profile">`;
  });

  out = out.replace(
    /<div class="([^"]*\belementor-container\b[^"]*)">/gi,
    (match, cls, offset) => {
      if (cls.includes('wp-university-profile-grid')) return match;
      const before = out.slice(Math.max(0, offset - 400), offset);
      if (!/\bwp-university-profile\b/.test(before)) return match;
      const slice = out.slice(offset, offset + 5000);
      if (!/\belementor-col-50\b/.test(slice)) return match;
      if (!/eael-data-table-wrap|elementor-widget-eael-data-table/i.test(slice)) return match;
      return `<div class="${cls} wp-university-profile-grid wp-editorial-split">`;
    }
  );

  return out;
}

/** Strip grid/step classes wrongly applied to Elementor icon rows; optional contact linkify. */
export function fixElementorIconListLayout(html: string): string {
  return html.replace(
    /<ul(\s+class=")([^"]*)("[^>]*>)([\s\S]*?)<\/ul>/gi,
    (full, clsOpen, cls, clsEnd, inner) => {
      if (!/elementor-icon-list-items/i.test(cls) && !/<li\b[^>]*elementor-icon-list-item/i.test(inner)) {
        return full;
      }

      const plain = stripHtml(inner);
      const contactStrip =
        /Contact Us Now!/i.test(
          html.slice(Math.max(0, html.indexOf(full) - 1200), html.indexOf(full))
        ) ||
        (/\b\d{10}\b/.test(plain) && /@/.test(plain));

      let nextCls = cls.replace(GRID_LIST_CLASS_RE, '').replace(/\s+/g, ' ').trim();
      nextCls = `${nextCls} wp-icon-list-premium`.trim();
      if (contactStrip) nextCls = `${nextCls} wp-contact-strip`.trim();

      const liCount = (inner.match(/<li\b/gi) || []).length;
      const isBenefitsList =
        !contactStrip &&
        liCount >= 3 &&
        liCount <= 8 &&
        (/Why pursue|Affordability:|Quality Education:/i.test(plain) ||
          (inner.match(/elementor-icon-list-text">[^<]*:/gi) || []).length >= 3);
      if (isBenefitsList) nextCls = `${nextCls} wp-premium-benefits-grid`.trim();

      const enhanced = enhanceIconListItems(inner, contactStrip);
      return `<ul${clsOpen}${nextCls}${clsEnd}${enhanced}</ul>`;
    }
  );
}

/** Standalone address paragraphs → highlighted card. */
export function highlightAddressBlocks(html: string): string {
  return html.replace(
    /<p(\b[^>]*)>([\s\S]*?)<\/p>/gi,
    (full, attrs, inner) => {
      if (/wp-address-highlight/.test(full)) return full;
      const plain = stripHtml(inner);
      if (!isAddressPlainText(plain) || plain.length > 220) return full;
      return `<div class="wp-address-highlight"><p${attrs}>${inner}</p></div>`;
    }
  );
}

/** Contact Us icon rows → readable linked cards (tel / mailto / contact page). */
export function enhanceContactIconLists(html: string): string {
  return html;
}

/** WP Elementor buttons exported without href (popups) → live contact route. */
export function wireCtaButtonsToContact(html: string): string {
  return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (full, attrs, inner) => {
    if (!/elementor-button/i.test(attrs)) return full;
    if (!CTA_CONTACT_LABEL_RE.test(stripHtml(inner))) return full;

    if (/\bhref\s*=\s*["'](?!#|javascript:)[^"']+["']/i.test(attrs)) return full;

    let nextAttrs = attrs.trim();
    if (!/\bhref\s*=/i.test(nextAttrs)) {
      nextAttrs = `${nextAttrs} href="/contact"`;
    } else {
      nextAttrs = nextAttrs.replace(/\bhref\s*=\s*["']#["']/i, 'href="/contact"');
    }
    return `<a ${nextAttrs}>${inner}</a>`;
  });
}

/** CMS exports often add font-weight: 400 inline — strips it so site Inter typography applies. */
export function stripWpInlineTypography(html: string): string {
  let out = html.replace(/\s+style="font-weight:\s*400;?"/gi, '');

  out = out.replace(/\s+style="([^"]*)"/gi, (_match, styleContent: string) => {
    const kept = styleContent
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => {
        const key = s.split(':')[0]?.trim().toLowerCase() ?? '';
        return !['font-weight', 'font-family', 'font-size', 'font-style'].includes(key);
      });
    if (!kept.length) return '';
    return ` style="${kept.join('; ')}"`;
  });

  return out;
}

/** Bold label followed by line-broken spans → nested doc list (MBBS admission export quirk). */
export function normalizeAdmissionListItems(html: string): string {
  return html.replace(/<li(\b[^>]*)>([\s\S]*?)<\/li>/gi, (match, attrs, inner) => {
    if (/<ul\b|<ol\b/i.test(inner)) return match;

    const boldMatch = inner.match(
      /^(\s*(?:<br\s*\/?>\s*)*)(<(?:b|strong)\b[^>]*>)([\s\S]*?)(<\/(?:b|strong)>)([\s\S]*)$/i
    );
    if (!boldMatch) return match;

    const [, prefix, bOpen, bText, bClose, rest] = boldMatch;
    const title = stripHtml(bText).replace(/:\s*$/, '').trim();
    if (!title || title.length < 4) return match;

    const spans = [...rest.matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/gi)]
      .map((m) => stripHtml(m[1]).replace(/\s+/g, ' ').trim())
      .filter((t) => t.length > 1);

    if (spans.length < 2) return match;

    const cleanTitle = bText.replace(/<br\s*\/?>/gi, ' ').trim().replace(/:+\s*$/, '');
    const nested = spans.map((t) => `<li>${t}</li>`).join('');
    return `<li${attrs}>${prefix}${bOpen}${cleanTitle}:${bClose}<ul>${nested}</ul></li>`;
  });
}

/** Move a leading colon from description span onto the bold title (BPT card font/layout quirk). */
export function normalizeBoldTitleDescriptionItems(html: string): string {
  return html.replace(/<li(\b[^>]*)>([\s\S]*?)<\/li>/gi, (match, attrs, inner) => {
    const normalized = inner.replace(
      /(<(?:b|strong)\b[^>]*>)([\s\S]*?)(<\/(?:b|strong)>)\s*<span\b([^>]*)>\s*:\s*/i,
      '$1$2:$3<span$4> '
    );
    if (normalized === inner) return match;
    return `<li${attrs}>${normalized}</li>`;
  });
}

function normalizeListItemContent(inner: string): string {
  if (/elementor-icon-list-icon/i.test(inner) || /elementor-icon-list-text/i.test(inner)) {
    return inner.replace(/<span\b[^>]*>\s*(?:<br\s*\/?>\s*)*<\/span>/gi, '');
  }

  let out = flattenNestedSpans(inner);
  out = out.replace(/<span\b[^>]*>\s*(?:<br\s*\/?>\s*)*<\/span>/gi, '');

  const spans: { attrs: string; content: string }[] = [];
  const spanRe = /<span\b([^>]*)>([\s\S]*?)<\/span>/gi;
  let m: RegExpExecArray | null;
  while ((m = spanRe.exec(out)) !== null) {
    const content = m[2].trim();
    if (content && !/^<br\s*\/?>$/i.test(content)) {
      spans.push({ attrs: m[1], content });
    }
  }

  if (spans.length <= 1) return out.trim() || inner;

  const withoutSpans = out.replace(/<span\b[^>]*>[\s\S]*?<\/span>/gi, '').trim();
  if (withoutSpans && !/^<br\s*\/?>$/i.test(withoutSpans)) return out;

  const merged = spans
    .map((s) => s.content.replace(/<br\s*\/?>/gi, ' ').trim())
    .filter(Boolean)
    .join(' ');

  if (!merged) return out.trim() || inner;
  return `<span${spans[0].attrs}>${merged}</span>`;
}

/** Collapse multi-span list items before grid classification (site-wide CMS export quirk). */
export function normalizeListItemSpans(html: string): string {
  return html.replace(/<li(\b[^>]*)>([\s\S]*?)<\/li>/gi, (match, attrs, inner) => {
    let normalized = normalizeListItemContent(inner);
    normalized = normalized.replace(
      /(\d+(?:st|nd|rd|th))(?:\s*<br\s*\/?>\s*|\s*<\/span>\s*<span[^>]*>\s*)(percentile)/gi,
      '$1 $2'
    );
    if (normalized === inner) return match;
    return `<li${attrs}>${normalized}</li>`;
  });
}

/** Direct children only — nested doc lists must not inflate parent list metrics. */
function splitTopLevelListItems(inner: string): string[] {
  const items: string[] = [];
  const tagRe = /<\/?(?:li|ul|ol)\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  let captureStart = -1;
  let liDepth = 0;

  while ((match = tagRe.exec(inner)) !== null) {
    const full = match[0];
    const closing = /^<\//.test(full);
    const tag = full.match(/<\/?(\w+)/i)?.[1]?.toLowerCase();
    if (tag !== 'li') continue;

    if (!closing) {
      if (liDepth === 0) captureStart = match.index;
      liDepth++;
      continue;
    }

    liDepth--;
    if (liDepth === 0 && captureStart >= 0) {
      items.push(inner.slice(captureStart, match.index + full.length));
      captureStart = -1;
    }
  }

  return items;
}

function listItemBodies(inner: string): string[] {
  return splitTopLevelListItems(inner).map((item) =>
    item.replace(/^<li\b[^>]*>/i, '').replace(/<\/li>\s*$/i, '')
  );
}

function countTopLevelListItems(inner: string): number {
  return splitTopLevelListItems(inner).length;
}

function hasTitleDescPattern(body: string): boolean {
  return /<(?:b|strong)\b[^>]*>[\s\S]*?<\/(?:b|strong)>[\s\S]*?<span\b/i.test(body);
}

function isElementorIconList(attrs: string, inner: string): boolean {
  return (
    /elementor-icon-list-items/i.test(attrs) ||
    /<li\b[^>]*elementor-icon-list-item/i.test(inner)
  );
}

/** Admission / process steps — span-only bullets, not feature-card promos. */
function isProceduralStepList(inner: string): boolean {
  if (/<li\b[^>]*elementor-icon-list-item/i.test(inner)) return false;

  const liBodies = listItemBodies(inner);
  if (liBodies.length < 2 || liBodies.length > 10) return false;

  const spanOnly = liBodies.filter((body) => {
    if (!stripHtml(body).trim()) return false;
    return !/<(?:b|strong)\b/i.test(body);
  }).length;

  if (spanOnly === liBodies.length) return true;

  const titleDescCount = liBodies.filter(hasTitleDescPattern).length;
  if (liBodies.length <= 4 && titleDescCount <= 1 && spanOnly >= 1) return true;

  return false;
}

/** Long body copy per bullet (Student Support, etc.) — chip numbers squeeze paragraphs. */
function isParagraphStyleList(inner: string): boolean {
  if (isProceduralStepList(inner)) return false;

  const items = listItemBodies(inner).map((body) => stripHtml(body).trim());
  if (items.length < 2) return false;
  const longCount = items.filter((t) => t.length >= PARAGRAPH_LIST_MIN_CHARS).length;
  return longCount >= Math.ceil(items.length * 0.4);
}

/** Title + description in same <li> (e.g. Recognized Institution: Approved by NMC…) */
function isFeatureStyleList(inner: string): boolean {
  if (isProceduralStepList(inner)) return false;

  const liCount = countTopLevelListItems(inner);
  if (liCount < 2 || liCount > 16) return false;

  const withTitleDesc = (
    inner.match(/<li\b[^>]*>[\s\S]*?<(?:b|strong)\b[^>]*>[\s\S]*?<\/(?:b|strong)>[\s\S]*?<span\b/gi) ||
      []
  ).length;

  if (withTitleDesc >= 2) return true;

  const liBodies = listItemBodies(inner);
  const inlineRich = liBodies.filter(
    (body) => /<span\b/i.test(body) && /<(?:b|strong)\b/i.test(body)
  ).length;
  if (inlineRich >= 2) return true;

  const withBoldHeading = (
    inner.match(/<li\b[^>]*>[\s\S]*?<(?:b|strong)\b[^>]*>[^<]{8,}<\/(?:b|strong)>/gi) || []
  ).length;

  return withBoldHeading >= 2 && liCount <= 12;
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
    if (isElementorIconList(attrs, inner)) return match;
    const liCount = countTopLevelListItems(inner);
    if (isProceduralStepList(inner)) {
      const openTag = addGridClassToListTag(`<ul${attrs}>`, 'wp-premium-steps-list');
      return `${openTag}${inner}</ul>`;
    }
    if (isFeatureStyleList(inner) || isParagraphStyleList(inner)) {
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
    if (isElementorIconList(attrs, inner)) return match;
    const liCount = countTopLevelListItems(inner);
    if (isProceduralStepList(inner)) {
      const openTag = addGridClassToListTag(`<ol${attrs}>`, 'wp-premium-steps-list');
      return `${openTag}${inner}</ol>`;
    }
    if (isFeatureStyleList(inner) || isParagraphStyleList(inner)) {
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

/** FAQ Q/A lines from paragraphs, subheadings, and list items (Payload + WP). */
function extractFaqLines(html: string): string[] {
  const lines: string[] = [];
  const re = /<(p|h[345]|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (!isSkippableParagraph(m[2])) lines.push(m[2].trim());
  }
  return lines.length ? lines : extractParagraphs(html);
}

/** Stop FAQ body capture at next major section (Payload has no WP </section> after FAQs). */
const FAQ_SECTION_BODY_END =
  '(?=<h2\\b|<div class="xs_social|<\\/section>|<section\\b|$)';

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
  if (/^\d+\.\s+/.test(text)) return false;
  return text.length > 0;
}

function parseNumberedQuestionParagraph(inner: string): { num: string; question: string } | null {
  const text = stripHtml(inner);
  const m = text.match(/^(\d+)\.\s+(.+)$/);
  if (!m) return null;
  const question = m[2].trim();
  if (question.length < 3) return null;
  return { num: m[1], question };
}

function parseNumberedFaqItemsFromLines(lines: string[]): FaqItem[] {
  const items: FaqItem[] = [];
  let i = 0;
  while (i < lines.length) {
    const q = parseNumberedQuestionParagraph(lines[i]);
    if (!q) {
      i += 1;
      continue;
    }

    const answerParts: string[] = [];
    let j = i + 1;
    while (j < lines.length) {
      if (parseNumberedQuestionParagraph(lines[j]) || parseQuestionParagraph(lines[j])) break;
      const text = stripHtml(lines[j]);
      if (!text) {
        j += 1;
        continue;
      }
      answerParts.push(`<p>${lines[j]}</p>`);
      j += 1;
    }

    if (answerParts.length) {
      items.push({ num: q.num, question: q.question, answer: answerParts.join('') });
      i = j;
    } else {
      i += 1;
    }
  }
  return items;
}

function parseNumberedFaqItemsFromHtml(block: string): FaqItem[] {
  return parseNumberedFaqItemsFromLines(extractFaqLines(block));
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

  const lines = extractFaqLines(block);
  let i = 0;
  while (i < lines.length) {
    const same = parseSameParagraphQa(lines[i]);
    if (same) {
      items.push(same);
      i += 1;
      continue;
    }

    const q = parseQuestionParagraph(lines[i]);
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
    while (j < lines.length) {
      if (parseQuestionParagraph(lines[j]) || parseNumberedQuestionParagraph(lines[j])) break;
      if (isAnswerParagraph(lines[j])) {
        answer = cleanAnswerHtml(lines[j]);
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

  if (items.length >= 2) return items;

  const numbered = parseNumberedFaqItemsFromHtml(block);
  if (numbered.length >= 2) return numbered;
  if (!items.length && numbered.length) return numbered;

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

function findClosingDiv(html: string, openIdx: number): number {
  const openTagEnd = html.indexOf('>', openIdx);
  if (openTagEnd === -1) return -1;

  let depth = 1;
  let i = openTagEnd + 1;
  const openRe = /<div\b/gi;
  const closeRe = /<\/div>/gi;

  while (depth > 0 && i < html.length) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const nextOpen = openRe.exec(html);
    const nextClose = closeRe.exec(html);
    if (!nextClose) return -1;

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      i = nextOpen.index + nextOpen[0].length;
    } else {
      depth -= 1;
      i = nextClose.index + nextClose[0].length;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function parseWpsmPanelItems(block: string): FaqItem[] {
  const items: FaqItem[] = [];
  const panelStartRe = /<div class="wpsm_panel wpsm_panel-default">/gi;
  let startMatch: RegExpExecArray | null;

  while ((startMatch = panelStartRe.exec(block)) !== null) {
    const panelOpen = startMatch.index;
    const panelEnd = findClosingDiv(block, panelOpen);
    if (panelEnd === -1) continue;

    const panel = block.slice(panelOpen, panelEnd);
    const titleMatch = panel.match(/<span class="ac_title_class"[^>]*>([\s\S]*?)<\/a>/i);
    const bodyMatch = panel.match(/<div class="wpsm_panel-body"[^>]*>([\s\S]*?)<\/div>/i);
    if (!titleMatch || !bodyMatch) continue;

    const question = stripHtml(titleMatch[1]).trim();
    const answer = bodyMatch[1].trim();
    if (!question || !stripHtml(answer)) continue;

    items.push({ num: String(items.length + 1), question, answer });
  }

  return items;
}

/** Remove WP Smart Accordion assets that break layout without Bootstrap/jQuery. */
export function stripWpsmAccordionAssets(html: string): string {
  let out = html;
  out = out.replace(/<style>[\s\S]*?#wpsm_accordion_\d+[\s\S]*?<\/style>/gi, '');
  out = out.replace(/<script type="text\/javascript">[\s\S]*?do_resize[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<!-- Inner panel (?:Start|End) -->/gi, '');
  if (!out.includes('wp-premium-faq-group')) {
    return out;
  }
  out = out.replace(/<div class="wpsm_panel[\s\S]*?<\/div>\s*(?=\s*(?:<div class="wpsm_panel|<\/p>|$))/gi, '');
  out = out.replace(/<div class="wpsm_panel-group"[^>]*>\s*<\/div>/gi, '');
  return out;
}

/** WP Smart Accordion (wpsm) → same premium FAQ UI. */
export function transformWpsmAccordions(html: string): string {
  if (!html.includes('wpsm_panel') && !html.includes('wpsm_accordion_')) return html;

  let out = html;
  const marker = 'wpsm_panel-group';
  let searchFrom = 0;

  while (searchFrom < out.length) {
    const groupIdx = out.indexOf(marker, searchFrom);
    if (groupIdx === -1) break;

    const groupOpen = out.lastIndexOf('<div', groupIdx);
    if (groupOpen === -1) {
      searchFrom = groupIdx + marker.length;
      continue;
    }

    const blockStart = groupOpen;
    const blockEnd = findClosingDiv(out, groupOpen);
    if (blockEnd === -1) {
      searchFrom = groupIdx + marker.length;
      continue;
    }

    let end = blockEnd;
    const trailingScript = out.slice(end).match(/^\s*<script[\s\S]*?<\/script>/i);
    if (trailingScript) end += trailingScript[0].length;

    const block = out.slice(blockStart, end);
    const items = parseWpsmPanelItems(block);
    if (!items.length) {
      searchFrom = groupIdx + marker.length;
      continue;
    }

    const replacement = `<div class="wp-premium-faq-group wp-premium-faq-group--animated">${buildFaqDetailsHtml(items)}</div>`;
    out = out.slice(0, blockStart) + replacement + out.slice(end);
    searchFrom = blockStart + replacement.length;
  }

  out = stripWpsmAccordionAssets(out);
  return out;
}

/** All FAQ blocks under "FAQs" heading → animated accordion (transforms in place, no content copy). */
export function transformWpFaqParagraphs(html: string): string {
  return html.replace(
    new RegExp(
      `(<h[23][^>]*>[\\s\\S]*?\\bFAQs?\\b[\\s\\S]*?<\\/h[23]>)(\\s*)([\\s\\S]*?)${FAQ_SECTION_BODY_END}`,
      'gi'
    ),
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
    new RegExp(
      `(<h[23][^>]*>[\\s\\S]*?\\bFAQs?\\b[\\s\\S]*?<\\/h[23]>)(\\s*)([\\s\\S]*?)${FAQ_SECTION_BODY_END}`,
      'gi'
    ),
    (full, heading, _sp, body) => {
      const hasQa = /<p[^>]*>[\s\S]*?Q\s*\d+\s*[.:]/i.test(body);
      const hasNumbered = /<p[^>]*>[\s\S]*?\b\d+\.\s+/i.test(body);
      if ((!hasQa && !hasNumbered) || body.includes('wp-premium-faq-group')) {
        return full;
      }
      const items = parseFaqItemsFromHtml(body);
      if (!items.length) return full;
      return wrapFaqGroup(items, heading);
    }
  );
}

/** Remove empty style/p wrappers left after WPSM FAQ conversion. */
export function stripFaqSectionJunk(html: string): string {
  let out = html;
  out = out.replace(/<style>[\s\S]*?#wpsm_accordion_\d+[\s\S]*?<\/style>/gi, '');
  out = out.replace(/<p>\s*<style>\s*(?=<div[^>]*wp-premium-faq-group)/gi, '');
  out = out.replace(/<style>\s*(?=<div[^>]*wp-premium-faq-group)/gi, '');
  out = out.replace(/<\/h2>\s*<p>\s*(?=<div[^>]*wp-premium-faq-group)/gi, '</h2>');
  out = out.replace(/<p>\s*(?=<div[^>]*wp-premium-faq-group)/gi, '');
  out = out.replace(/<\/style>\s*(?=<div[^>]*wp-premium-faq-group)/gi, '');
  out = out.replace(/<p>\s*<\/p>/gi, '');
  return out;
}

/** Every FAQ format on pages & blogs → one animated accordion system. */
export function transformAllFaqs(html: string): string {
  let out = html;
  out = transformSchemaFaqBlocks(out);
  out = transformEbAccordions(out);
  out = transformWpsmAccordions(out);
  out = transformWpFaqParagraphs(out);
  out = transformRemainingFaqSections(out);
  out = stripFaqSectionJunk(out);
  return out;
}

export function prepareWpHtml(
  html: string,
  options?: {
    featuredImage?: string | null;
    title?: string;
    pageSlug?: string | null;
    /** When false, keep body images that match the hero featured image (separate ProgramPageHero). */
    dedupeFeaturedInBody?: boolean;
  }
): string {
  let out = html.trim();
  if (out && !/<[a-z][\s\S]*>/i.test(out)) {
    out = out
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
      .join('\n');
  }
  if (options?.featuredImage && options.dedupeFeaturedInBody) {
    out = removeDuplicateImages(out, options.featuredImage);
  }
  if (options?.title) out = removeDuplicateTitleHeading(out, options.title);
  out = demoteBodyH1ToH2(out);
  out = fixHeadingLevelSkips(out);
  out = stripElementorHiddenSections(out);
  out = cleanBrokenTableRows(out);
  out = stripEmptyEaelTableHeadings(out);
  out = normalizeEaelFactTableRows(out);
  out = normalizeEstablishmentFactLabels(out);
  out = demoteJkitCardTitles(out);
  out = demoteMultiColumnCardHeadings(out);
  out = stripBrokenIconWidgets(out);
  out = stripWpInlineTypography(out);
  out = normalizeElementorIconListItems(out);
  out = normalizeAdmissionListItems(out);
  out = normalizeBoldTitleDescriptionItems(out);
  out = normalizeListItemSpans(out);
  out = transformLongListsToGrid(out);
  out = simplifyFeatureGridIconLists(out);
  out = simplifyIconChipGridLists(out);
  out = transformEaelAccordions(out);
  out = transformAllFaqs(out);
  out = stripFaqSectionJunk(out);
  out = replaceBrokenEmbeddedForms(out);
  out = constrainInlineSvgs(out);
  out = wireCtaButtonsToContact(out);
  out = mergeCollegeCardGridSections(out);
  out = markEditorialSplitContainers(out);
  out = markCollapsedSpacerSplits(out);
  out = markUniversityProfileSections(out);
  out = markMbbsStateGridSections(out);
  out = fixElementorIconListLayout(out);
  out = enhanceContactIconLists(out);
  out = highlightAddressBlocks(out);
  out = rewriteInternalLinks(out);
  out = rewriteWpMediaUrlsInHtml(out);
  out = injectCollegeCardImagesInHtml(out, options?.pageSlug);
  out = normalizeContentImagesInHtml(out, {
    pageSlug: options?.pageSlug,
    featuredImage: options?.featuredImage,
  });
  out = injectMbbsIndiaStateImages(out, options?.pageSlug);
  out = injectMbbsAbroadCountryImages(out, options?.pageSlug);
  return out;
}

export function plainTitle(title: string): string {
  return plainTextFromHtml(title);
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
