/**
 * Restructure exported MBBS Abroad WP HTML for premium layout.
 * Text/content is preserved — only section classes change.
 */

import { fixAbroadWpContent } from '@/lib/fixAbroadWpContent';

const TOP_SECTION_RE =
  /<section\b([^>]*\belementor-top-section\b[^>]*)>([\s\S]*?)<\/section>/gi;

const INNER_SECTION_RE =
  /<section\b([^>]*\belementor-inner-section\b[^>]*)>([\s\S]*?)<\/section>/gi;

function stripText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function classifyTopSection(inner: string): string {
  const text = stripText(inner);
  const imgs = (inner.match(/<img\b/gi) || []).length;
  const mbbsIn = (inner.match(/MBBS\s+IN|Mbbs\s+in/gi) || []).length;

  if (/^Study\s+MBBS\s+ABROAD$/i.test(text) || inner.includes('>Study MBBS ABROAD<')) {
    return 'abroad-wp-suppress abroad-wp-countries-heading';
  }

  if (
    inner.includes('elementor-col-25') &&
    imgs >= 2 &&
    (mbbsIn >= 2 || inner.includes('MBBS in'))
  ) {
    return 'abroad-wp-suppress abroad-wp-countries';
  }

  if (/documents required/i.test(text) && /study\s+mbbs/i.test(text)) {
    return 'abroad-wp-suppress abroad-wp-documents';
  }

  if (/benefits of study mbbs/i.test(text)) {
    return 'abroad-wp-benefits-list';
  }

  if (/airport diaries/i.test(text)) {
    return 'abroad-wp-suppress abroad-wp-airport-diaries';
  }

  if (/academic requirements/i.test(text)) {
    return 'abroad-wp-suppress abroad-wp-duplicate-block';
  }

  if (/admission procedure/i.test(text) && inner.includes('elementor-icon-box')) {
    return 'abroad-wp-suppress abroad-wp-duplicate-block';
  }

  if (
    /partner universities|top mbbs abroad universities/i.test(text) &&
    imgs >= 3
  ) {
    return 'abroad-wp-suppress abroad-wp-partner-logos';
  }

  if (imgs >= 6 && mbbsIn < 2 && /university|medical college|partner|kursk|dhaka/i.test(text)) {
    return 'abroad-wp-suppress abroad-wp-partner-logos';
  }

  if (
    inner.includes('elementor-icon-box') &&
    /birth certificate|neet score|passport|bank statement/i.test(text)
  ) {
    return 'abroad-wp-suppress abroad-wp-documents';
  }

  return 'abroad-wp-section';
}

function classifyInnerSection(inner: string): string {
  const text = stripText(inner);
  const hasDocLabel =
    /x\s*&\s*xii\s*marksheet|neet\s*score\s*card|birth\s*certificate|bank\s*statement|english\s*certificate|medical\s*test|photographs|sponsorship\s*affidavit|minor\s*certificate|passport/i.test(
      text
    );

  if (hasDocLabel && (inner.includes('elementor-widget-heading') || inner.includes('<h3'))) {
    return 'abroad-wp-suppress abroad-wp-documents-inner';
  }

  if (
    inner.includes('elementor-col-20') &&
    (inner.match(/<img\b/gi) || []).length >= 1 &&
    hasDocLabel
  ) {
    return 'abroad-wp-suppress abroad-wp-documents-inner';
  }

  if (
    /^x\s*&\s*xii\s*marksheet$/i.test(text) &&
    inner.includes('elementor-icon-box') &&
    (inner.match(/<img\b/gi) || []).length <= 2
  ) {
    return 'abroad-wp-suppress abroad-wp-doc-orphan';
  }

  if (
    inner.includes('elementor-icon-box') &&
    /research and selection|submission of application|receiving of admission letter|visa application|departure and enrollment/i.test(
      text
    )
  ) {
    return 'abroad-wp-suppress abroad-wp-admission-grid';
  }

  return '';
}

function injectClassIntoSectionTag(openTag: string, extraClass: string): string {
  if (!extraClass) return openTag;
  if (/\bclass="/i.test(openTag)) {
    return openTag.replace(/\bclass="([^"]*)"/i, (_, classes) => {
      if (classes.includes(extraClass)) return `class="${classes}"`;
      return `class="${classes} ${extraClass}"`;
    });
  }
  return openTag.replace(/<section\b/i, `<section class="${extraClass}"`);
}

function mapSections(
  html: string,
  re: RegExp,
  classify: (inner: string) => string
): string {
  return html.replace(re, (_full, openPart, inner) => {
    const extra = classify(inner);
    const openTag = `<section${openPart}>`;
    const newOpen = injectClassIntoSectionTag(openTag, extra);
    return `${newOpen}${inner}</section>`;
  });
}

/** Mark Elementor sections for abroad hub premium CSS. */
export function prepareAbroadHubHtml(html: string): string {
  let out = fixAbroadWpContent(html);
  out = mapSections(out, TOP_SECTION_RE, classifyTopSection);
  out = mapSections(out, INNER_SECTION_RE, classifyInnerSection);
  return fixAbroadWpContent(out);
}
