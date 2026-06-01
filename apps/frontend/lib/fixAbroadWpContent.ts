/**
 * Fix common WP export glitches on MBBS Abroad hub (word splits, title punctuation).
 * Does not change meaning — only repairs broken markup.
 */

/** Join "O" + "ffers..." paragraphs and similar single-letter orphans. */
export function mergeOrphanLetterParagraphs(html: string): string {
  let out = html;

  out = out.replace(/\bWHO\(\s+/g, 'WHO (');
  out = out.replace(/\bNMC\(\s+/g, 'NMC (');

  out = out.replace(
    /(<p[^>]*>)\s*([A-Za-z])\s*(<\/p>)\s*(<p[^>]*>)\s*([a-z][\s\S]*?)(<\/p>)/gi,
    '$1$2$5$6'
  );

  out = out.replace(/<p[^>]*>\s*O\s*<\/p>\s*<p[^>]*>\s*ffers/gi, '<p>Offers');

  out = out.replace(
    /(<li\b[^>]*>[\s\S]*?<\/li>)\s*<li\b[^>]*>\s*<p[^>]*>\s*([A-Za-z])\s*<\/p>\s*([\s\S]*?)<\/li>/gi,
    (full, prevLi, letter, rest) => {
      if (!/^ffers|^nd |^n /i.test(rest.trim())) return full;
      const merged = prevLi.replace(/<\/li>\s*$/i, `<p>${letter}${rest}</p></li>`);
      return merged;
    }
  );

  return out;
}

/** "Global Recognition-" → "Global Recognition" and merge title-only rows with following body. */
export function normalizeBenefitFeatureList(html: string): string {
  let out = html;

  out = out.replace(
    /(<(?:b|strong)[^>]*>)([^<]*?)-(\s*<\/(?:b|strong)>)/gi,
    (match, open, title, close) => {
      if (title.trim().length < 4) return match;
      return `${open}${title.trim()}${close}`;
    }
  );

  out = out.replace(
    /<li\b([^>]*)>\s*((?:<(?:b|strong)[^>]*>[\s\S]*?<\/(?:b|strong)>)\s*)<\/li>\s*<li\b[^>]*>\s*<p[^>]*>\s*([A-Za-z])\s*<\/p>\s*([\s\S]*?)<\/li>/gi,
    '<li$1>$2<span class="abroad-benefit-body">$3$4</span></li>'
  );

  out = out.replace(
    /<li\b([^>]*)>\s*((?:<(?:b|strong)[^>]*>[\s\S]*?<\/(?:b|strong)>)\s*)<\/li>\s*<li\b[^>]*>\s*([\s\S]*?)<\/li>/gi,
    (full, attrs, titleHtml, body) => {
      const titleText = titleHtml.replace(/<[^>]+>/g, '').trim();
      const bodyText = body.replace(/<[^>]+>/g, '').trim();
      if (!titleText || bodyText.length < 12) return full;
      if (/^ffers|^nd |^n /i.test(bodyText)) {
        return `<li${attrs}>${titleHtml}<span class="abroad-benefit-body">${bodyText.charAt(0).toUpperCase()}${bodyText.slice(1)}</span></li>`;
      }
      return full;
    }
  );

  return out;
}

export function fixAbroadWpContent(html: string): string {
  let out = html;
  out = mergeOrphanLetterParagraphs(out);
  out = normalizeBenefitFeatureList(out);
  return out;
}
