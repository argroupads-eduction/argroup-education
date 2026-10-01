'use strict';

/**
 * Normalize Strapi Post content to HTML for marketing BlogPost + blog template.
 * - Already-HTML (block tags) → light trim only
 * - Markdown / plain → h1–h3, p, ul/ol, strong/em/links
 */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function looksLikeHtml(content) {
  if (!content || typeof content !== 'string') return false;
  return /<(p|h[1-6]|ul|ol|li|table|div|blockquote|details|pre|hr)\b/i.test(content);
}

function inlineFormat(text) {
  let s = escapeHtml(text);
  // links [text](url)
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" rel="noopener noreferrer">$1</a>'
  );
  // bold **text** or __text__ (before single-asterisk italic)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  // italic *text* or _text_
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
  // inline code
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

function markdownToHtml(src) {
  const lines = String(src || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .split('\n');

  const out = [];
  let i = 0;
  let para = [];

  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(' ').replace(/\s+/g, ' ').trim();
    para = [];
    if (!text) return;
    out.push(`<p>${inlineFormat(text)}</p>`);
  };

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      flushPara();
      i++;
      continue;
    }

    // fenced code
    if (/^```/.test(trimmed)) {
      flushPara();
      i++;
      const code = [];
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        code.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushPara();
      const level = Math.min(heading[1].length, 6);
      out.push(`<h${level}>${inlineFormat(heading[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      flushPara();
      const items = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ''));
        i++;
      }
      out.push(`<ul>${items.map((t) => `<li>${inlineFormat(t)}</li>`).join('')}</ul>`);
      continue;
    }

    // ordered list
    if (/^\d+[.)]\s+/.test(trimmed)) {
      flushPara();
      const items = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i++;
      }
      out.push(`<ol>${items.map((t) => `<li>${inlineFormat(t)}</li>`).join('')}</ol>`);
      continue;
    }

    // blockquote
    if (/^>\s?/.test(trimmed)) {
      flushPara();
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote><p>${inlineFormat(quote.join(' '))}</p></blockquote>`);
      continue;
    }

    // thematic break
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushPara();
      out.push('<hr />');
      i++;
      continue;
    }

    // plain short title-ish line → h2 (editor paste without #)
    if (
      trimmed.length < 90 &&
      !/[.!]/.test(trimmed) &&
      /^[A-Z0-9]/.test(trimmed) &&
      !/[,;:]$/.test(trimmed) &&
      para.length === 0
    ) {
      const next = (lines[i + 1] || '').trim();
      if (!next || next.length > 40 || /[.?!]$/.test(next) || /^#{1,6}\s/.test(next)) {
        // Only promote if next line looks like body (or EOF / blank)
        if (!next || /[.?!]/.test(next) || next.length > 60 || /^[-*+\d]/.test(next)) {
          flushPara();
          if (trimmed.endsWith('?') || /^[A-Z]/.test(trimmed)) {
            out.push(`<h2>${inlineFormat(trimmed)}</h2>`);
            i++;
            continue;
          }
        }
      }
    }

    para.push(trimmed);
    i++;
  }
  flushPara();
  return out.join('\n');
}

/**
 * @param {string} content
 * @returns {string}
 */
function normalizePostContentToHtml(content) {
  if (content == null) return '';
  const raw = String(content).trim();
  if (!raw) return '';

  if (looksLikeHtml(raw)) {
    return raw
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  return markdownToHtml(raw);
}

function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstParagraphText(html, maxLen = 220) {
  const m = String(html || '').match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  const text = stripTags(m ? m[1] : html).slice(0, maxLen);
  return text;
}

module.exports = {
  normalizePostContentToHtml,
  looksLikeHtml,
  stripTags,
  firstParagraphText,
  markdownToHtml,
};
