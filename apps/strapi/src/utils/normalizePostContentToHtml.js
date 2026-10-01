'use strict';

/**
 * Normalize Strapi Post content → marketing BlogPost HTML.
 * - Markdown / plain → h2/h3/p/ul/ol + premium FAQ accordion
 * - Existing HTML → keep body tags, convert FAQ blocks to wp-premium-faq structure
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
  return stripTags(m ? m[1] : html).slice(0, maxLen);
}

function inlineFormat(text) {
  let s = escapeHtml(text);
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" rel="noopener noreferrer">$1</a>'
  );
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

function stripFaqQuestionNumberPrefix(question) {
  return String(question || '')
    .replace(/^#+\s+/, '')
    .replace(/^Ques(?:tion)?\s*\d+\s*[-–—:.)\]]\s*/i, '')
    .replace(/^Q\s*\d+\s*[.:)\]]\s*/i, '')
    .replace(/^\d+\s*[.)]\s+/, '')
    .replace(/^\d+\s*[-–—]\s+/, '')
    .trim();
}

function wrapFaqAnswerHtml(answer) {
  const trimmed = String(answer || '').trim();
  if (!trimmed) return '';
  if (/wp-premium-faq-answer-label/.test(trimmed)) return trimmed;
  const label = '<strong class="wp-premium-faq-answer-label">Answer:</strong> ';
  const plain = stripTags(trimmed);
  if (/^<p[\s>]/i.test(trimmed)) {
    return trimmed.replace(/^<p([^>]*)>/i, `<p class="wp-premium-faq-answer"$1>${label}`);
  }
  return `<p class="wp-premium-faq-answer">${label}${escapeHtml(plain)}</p>`;
}

/** Live-site FAQ accordion (matches BlogPostLayout / wp-content.css). */
function buildFaqHtml(faqs) {
  if (!faqs.length) return '';
  const items = faqs
    .map((f, i) => {
      const n = String(i + 1).padStart(2, '0');
      const q = stripFaqQuestionNumberPrefix(f.q) || f.q;
      return (
        `<details class="wp-premium-faq" style="--faq-i:${i}">` +
        `<summary class="wp-premium-faq-summary">` +
        `<span class="wp-premium-faq-qnum">${n}</span>` +
        `<span class="wp-premium-faq-qtext"><h3 class="wp-faq-heading">${escapeHtml(q)}</h3></span>` +
        `</summary>` +
        `<div class="wp-premium-faq-body"><div class="wp-premium-faq-body-inner">${wrapFaqAnswerHtml(f.a)}</div></div>` +
        `</details>`
      );
    })
    .join('');
  return (
    `<h2>Frequently Asked Questions</h2>\n` +
    `<div class="wp-premium-faq-group wp-premium-faq-group--animated">${items}</div>`
  );
}

function isFaqSectionHeading(text) {
  const t = stripTags(text).trim();
  return /^(frequently\s+asked\s+questions|faqs?|faq'?s?)\s*$/i.test(t);
}

function looksLikeQuestion(text) {
  const t = stripTags(text).trim();
  if (!t || t.length > 180) return false;
  if (/\?$/.test(t)) return true;
  return /^(?:Ques(?:tion)?\s*\d+|Q\s*\d+)\s*[-–—:.)\]]/i.test(t);
}

/**
 * Parse markdown/plain lines → { html without FAQ, faqs[] }
 */
function parseLinesToHtmlAndFaqs(src) {
  const lines = String(src || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .split('\n');

  const out = [];
  const faqs = [];
  let i = 0;
  let para = [];
  let inFaq = false;

  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(' ').replace(/\s+/g, ' ').trim();
    para = [];
    if (!text) return;
    if (inFaq && looksLikeQuestion(text) && !faqs.length) {
      // lone question without answer yet — keep as heading outside
    }
    out.push(`<p>${inlineFormat(text)}</p>`);
  };

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      flushPara();
      i++;
      continue;
    }

    if (isFaqSectionHeading(trimmed) || /^#{1,3}\s+(FAQs?|Frequently Asked Questions)\s*$/i.test(trimmed)) {
      flushPara();
      inFaq = true;
      i++;
      continue;
    }

    if (inFaq) {
      const faqLine = trimmed.replace(/^#+\s+/, '');
      const qm = faqLine.match(
        /^(?:Ques(?:tion)?\s*)?(?:Q\s*)?(\d+)[.)\]:\-–—]?\s+(.+\?)\s*$/i
      );
      const qm2 = looksLikeQuestion(faqLine) ? faqLine : null;
      if (qm || qm2) {
        const q = stripFaqQuestionNumberPrefix(qm ? qm[2] : qm2);
        const ans = [];
        i++;
        while (i < lines.length) {
          const t = lines[i].trim();
          if (!t) {
            i++;
            if (ans.length) break;
            continue;
          }
          if (
            isFaqSectionHeading(t) ||
            /^(?:Ques(?:tion)?\s*)?(?:Q\s*)?\d+[.)\]:\-–—]?\s+/.test(t) ||
            (looksLikeQuestion(t) && ans.length) ||
            /^#{1,3}\s+/.test(t)
          ) {
            break;
          }
          ans.push(t.replace(/^(?:Answer|Ans)\s*[.:]\s*/i, ''));
          i++;
        }
        const a = ans.join(' ').replace(/\s+/g, ' ').trim();
        if (q && a) faqs.push({ q, a });
        continue;
      }
      // non-Q line inside FAQ — treat as body until a question appears
      if (/^#{1,3}\s+/.test(trimmed) && !looksLikeQuestion(trimmed.replace(/^#+\s+/, ''))) {
        inFaq = false;
        // fall through to normal heading handling below
      } else {
        i++;
        continue;
      }
    }

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
      const ht = heading[2].trim();
      if (isFaqSectionHeading(ht)) {
        inFaq = true;
        i++;
        continue;
      }
      out.push(`<h${level}>${inlineFormat(ht)}</h${level}>`);
      i++;
      continue;
    }

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

    if (/^\d+[.)]\s+/.test(trimmed) && !looksLikeQuestion(trimmed)) {
      flushPara();
      const items = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim()) && !looksLikeQuestion(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i++;
      }
      if (items.length) {
        out.push(`<ol>${items.map((t) => `<li>${inlineFormat(t)}</li>`).join('')}</ol>`);
        continue;
      }
    }

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

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushPara();
      out.push('<hr />');
      i++;
      continue;
    }

    // Short title line → h2
    if (
      !inFaq &&
      trimmed.length < 90 &&
      !/[.!]/.test(trimmed) &&
      /^[A-Z0-9]/.test(trimmed) &&
      !/[,;]$/.test(trimmed) &&
      para.length === 0
    ) {
      const next = (lines[i + 1] || '').trim();
      if (!next || /[.?!]/.test(next) || next.length > 60 || /^[-*+\d#]/.test(next)) {
        if (trimmed.endsWith('?') || /^[A-Z]/.test(trimmed)) {
          flushPara();
          if (isFaqSectionHeading(trimmed)) {
            inFaq = true;
          } else {
            out.push(`<h2>${inlineFormat(trimmed)}</h2>`);
          }
          i++;
          continue;
        }
      }
    }

    para.push(trimmed);
    i++;
  }
  flushPara();

  let html = out.join('\n');
  if (faqs.length) html += (html ? '\n' : '') + buildFaqHtml(faqs);
  return html;
}

/**
 * Convert FAQ-shaped HTML (h2/h3/? + p) into premium accordion.
 * Skips if already using wp-premium-faq.
 */
function enhanceHtmlFaqs(html) {
  let src = String(html || '');
  if (/wp-premium-faq-group|class=["']wp-premium-faq["']/.test(src)) {
    return src;
  }

  // Find FAQ heading
  const headingRe =
    /<h2\b[^>]*>\s*(Frequently\s+Asked\s+Questions|FAQs?)\s*<\/h2>/i;
  const hm = headingRe.exec(src);
  if (!hm) {
    // Also try converting trailing Q/A h2+p clusters without a FAQ title
    return enhanceLooseQuestionBlocks(src);
  }

  const start = hm.index;
  const afterHeading = start + hm[0].length;
  const rest = src.slice(afterHeading);
  const nextH2 = rest.search(/<h2\b/i);
  const faqChunk = nextH2 === -1 ? rest : rest.slice(0, nextH2);
  const tail = nextH2 === -1 ? '' : rest.slice(nextH2);

  const faqs = extractFaqsFromHtmlChunk(faqChunk);
  if (!faqs.length) return src;

  const rebuilt =
    src.slice(0, start) + buildFaqHtml(faqs) + (tail ? '\n' + tail : '');
  return rebuilt;
}

function extractFaqsFromHtmlChunk(chunk) {
  const faqs = [];
  // Pair h2/h3/? headings with following paragraphs until next heading
  const blockRe =
    /<(h[23]|p)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let pendingQ = null;
  let ansParts = [];
  let m;
  const flush = () => {
    if (pendingQ && ansParts.length) {
      faqs.push({
        q: stripFaqQuestionNumberPrefix(stripTags(pendingQ)),
        a: ansParts.map((a) => stripTags(a)).join(' ').trim(),
      });
    }
    pendingQ = null;
    ansParts = [];
  };

  while ((m = blockRe.exec(chunk)) && faqs.length < 40) {
    const tag = m[1].toLowerCase();
    const inner = m[2];
    const text = stripTags(inner);
    if (!text) continue;

    if (tag === 'h2' || tag === 'h3' || (tag === 'p' && looksLikeQuestion(text) && !ansParts.length)) {
      if (looksLikeQuestion(text) || tag === 'h2' || tag === 'h3') {
        if (looksLikeQuestion(text)) {
          flush();
          pendingQ = text;
          continue;
        }
      }
    }

    if (pendingQ && tag === 'p') {
      ansParts.push(inner.replace(/^(?:Answer|Ans)\s*[.:]\s*/i, ''));
      continue;
    }

    // Q in same paragraph: "Q1. …? Answer: …"
    const inline = text.match(
      /^(?:Q(?:ues(?:tion)?)?\s*\d+\s*[.:)\]]\s*)?(.+\?)\s*(?:Answer|Ans)\s*[.:]\s*(.+)$/i
    );
    if (inline) {
      flush();
      faqs.push({
        q: stripFaqQuestionNumberPrefix(inline[1].trim()),
        a: inline[2].trim(),
      });
    }
  }
  flush();
  return faqs.filter((f) => f.q && f.a && f.a.length > 8);
}

/** Convert standalone h2 questions (ending ?) + following p into FAQ if ≥2 pairs. */
function enhanceLooseQuestionBlocks(html) {
  const src = String(html || '');
  if (/wp-premium-faq/.test(src)) return src;

  const faqs = [];
  const re = /<h2\b[^>]*>([\s\S]*?)<\/h2>\s*((?:<p\b[^>]*>[\s\S]*?<\/p>\s*)+)/gi;
  let m;
  const ranges = [];
  while ((m = re.exec(src)) && faqs.length < 40) {
    const q = stripTags(m[1]).trim();
    if (!looksLikeQuestion(q)) continue;
    const a = stripTags(m[2]).trim();
    if (a.length < 12) continue;
    faqs.push({ q: stripFaqQuestionNumberPrefix(q), a });
    ranges.push([m.index, m.index + m[0].length]);
  }
  if (faqs.length < 2) return src;

  // Replace from first FAQ pair through last with one accordion block
  const start = ranges[0][0];
  const end = ranges[ranges.length - 1][1];
  return src.slice(0, start) + buildFaqHtml(faqs) + src.slice(end);
}

/** Light heading/paragraph cleanup for Strapi richtext HTML. */
function polishHtmlFormatting(html) {
  let s = String(html || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Unwrap useless single-line <p><strong>Title</strong></p> → h2 when short
  s = s.replace(
    /<p>\s*<strong>([^<]{8,90})<\/strong>\s*<\/p>/gi,
    (_, t) => {
      const text = t.trim();
      if (/[.!?]$/.test(text) && text.length > 60) return `<p><strong>${text}</strong></p>`;
      if (isFaqSectionHeading(text)) return `<h2>${text}</h2>`;
      return `<h2>${text}</h2>`;
    }
  );

  // Ensure blank lines between block elements don't collapse weirdly
  s = s.replace(/(<\/(?:p|h[1-6]|ul|ol|blockquote|table|div)>)\s*(<(?:p|h[1-6]|ul|ol|blockquote|table|div)\b)/gi, '$1\n$2');
  return s;
}

function markdownToHtml(src) {
  return parseLinesToHtmlAndFaqs(src);
}

/**
 * @param {string} content
 * @returns {string}
 */
function normalizePostContentToHtml(content) {
  if (content == null) return '';
  const raw = String(content).trim();
  if (!raw) return '';

  let html;
  if (looksLikeHtml(raw)) {
    html = polishHtmlFormatting(raw);
  } else {
    html = markdownToHtml(raw);
  }

  html = enhanceHtmlFaqs(html);
  return html.trim();
}

module.exports = {
  normalizePostContentToHtml,
  looksLikeHtml,
  stripTags,
  firstParagraphText,
  markdownToHtml,
  buildFaqHtml,
  enhanceHtmlFaqs,
};
