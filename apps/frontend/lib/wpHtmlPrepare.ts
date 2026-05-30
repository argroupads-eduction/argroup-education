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
    items.push(`<details class="wp-premium-faq">
      <summary class="wp-premium-faq-summary"><h3 class="wp-faq-heading">${title}</h3></summary>
      <div class="wp-premium-faq-body">${body}</div>
    </details>`);
  }

  if (!items.length) return html;

  let out = html.replace(
    /<div class="eael-adv-accordion"[\s\S]*?<\/div>\s*(?=<\/div>\s*<\/div>)/i,
    `<div class="wp-premium-faq-group">${items.join('')}</div>`
  );

  // If wrapper replace missed, append transformed block and hide raw accordion via class
  if (!out.includes('wp-premium-faq-group')) {
    out = out.replace(
      /<div class="eael-adv-accordion"[\s\S]*?<\/div>\s*<\/div>/i,
      `<div class="wp-premium-faq-group">${items.join('')}</div>`
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
