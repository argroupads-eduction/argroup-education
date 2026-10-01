'use strict';

const { stripTags, firstParagraphText } = require('./normalizePostContentToHtml');

const SITE = 'https://www.argroupofeducation.com';
const LOGO = `${SITE}/ar-group-logo.webp`;

function toDateOnly(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function absoluteImage(url) {
  if (!url || typeof url !== 'string') return null;
  const s = url.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('/')) return `${SITE}${s}`;
  return s;
}

/**
 * Extract FAQ pairs from HTML (details/summary, or H2 questions + following p).
 * @param {string} html
 * @returns {{ q: string, a: string }[]}
 */
function extractFaqsFromHtml(html) {
  const faqs = [];
  const src = String(html || '');

  const detailsRe =
    /<details\b[^>]*>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>\s*([\s\S]*?)<\/details>/gi;
  let m;
  while ((m = detailsRe.exec(src)) && faqs.length < 40) {
    const q = stripTags(m[1]).replace(/^\d{1,2}\s+/, '').trim();
    const a = stripTags(m[2]).trim();
    if (q && a && q.endsWith('?')) faqs.push({ q, a });
  }
  if (faqs.length) return faqs;

  const headingRe = /<h2\b[^>]*>([\s\S]*?)<\/h2>\s*([\s\S]*?)(?=<h[1-6]\b|$)/gi;
  while ((m = headingRe.exec(src)) && faqs.length < 40) {
    const q = stripTags(m[1]).trim();
    if (!q.endsWith('?') || q.length > 160) continue;
    const aMatch = m[2].match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    const a = stripTags(aMatch ? aMatch[1] : m[2]).trim();
    if (a && a.length > 20) faqs.push({ q, a });
  }
  return faqs;
}

/**
 * Build Article (+ optional FAQPage) schema for a blog post.
 * @param {{
 *   title?: string,
 *   slug?: string,
 *   content?: string,
 *   excerpt?: string,
 *   metaDescription?: string,
 *   featuredImage?: string,
 *   ogImage?: string,
 *   publishedAt?: string|Date|null,
 *   legacyPublishedAt?: string|Date|null,
 *   author?: string,
 * }} post
 */
function buildPostSchemaJson(post) {
  const title = String(post.title || '').trim();
  const slug = String(post.slug || '').trim();
  if (!title || !slug) return null;

  const date =
    toDateOnly(post.legacyPublishedAt || post.publishedAt || post.updatedAt || null);
  const description =
    String(post.metaDescription || post.excerpt || '').trim() ||
    firstParagraphText(post.content || '', 160);
  const image = absoluteImage(post.featuredImage || post.ogImage);
  const pageUrl = `${SITE}/blog/${slug}`;

  const article = {
    '@type': 'Article',
    headline: title,
    description,
    datePublished: date,
    dateModified: date,
    author: {
      '@type': 'Organization',
      name: post.author || 'AR Group of Education',
      url: SITE,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AR Group of Education',
      logo: { '@type': 'ImageObject', url: LOGO },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    inLanguage: 'en-IN',
  };
  if (image) article.image = [image];

  const faqs = extractFaqsFromHtml(post.content || '');
  const graph = [article];
  if (faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

/**
 * Fill empty meta/excerpt fields from title + HTML content.
 * Mutates `data` (Strapi event.params.data).
 */
function applyMetaAutofill(data, htmlContent) {
  if (!data || typeof data !== 'object') return;

  const title = String(data.title || '').trim();
  const dek = firstParagraphText(htmlContent || data.content || '', 160);

  if (!String(data.excerpt || '').trim() && dek) {
    data.excerpt = dek;
  }
  if (!String(data.metaTitle || '').trim() && title) {
    data.metaTitle = title.slice(0, 500);
  }
  if (!String(data.metaDescription || '').trim() && (data.excerpt || dek)) {
    data.metaDescription = String(data.excerpt || dek).slice(0, 320);
  }
  if (!String(data.ogTitle || '').trim() && (data.metaTitle || title)) {
    data.ogTitle = String(data.metaTitle || title).slice(0, 500);
  }
  if (!String(data.ogDescription || '').trim() && (data.metaDescription || data.excerpt || dek)) {
    data.ogDescription = String(data.metaDescription || data.excerpt || dek).slice(0, 320);
  }
  if (!String(data.ogImage || '').trim() && data.featuredImage) {
    data.ogImage = data.featuredImage;
  }
}

module.exports = {
  buildPostSchemaJson,
  extractFaqsFromHtml,
  applyMetaAutofill,
  SITE,
};
