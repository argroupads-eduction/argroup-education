/**
 * Minimal Lexical → HTML for Payload CMS posts pulled over REST.
 * Kept in marketing backend so thin Payload push payloads can be repaired automatically.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

const F_BOLD = 1;
const F_ITALIC = 2;
const F_STRIKETHROUGH = 4;
const F_UNDERLINE = 8;
const F_CODE = 16;

function applyTextFormat(html: string, format: number, style: string): string {
  let out = html;
  if (format & F_CODE) out = `<code>${out}</code>`;
  if (format & F_BOLD) out = `<strong>${out}</strong>`;
  if (format & F_ITALIC) out = `<em>${out}</em>`;
  if (format & F_STRIKETHROUGH) out = `<s>${out}</s>`;
  if (format & F_UNDERLINE) out = `<u>${out}</u>`;
  if (style.trim()) out = `<span style="${escapeAttr(style.trim())}">${out}</span>`;
  return out;
}

function mediaValueToUrl(value: unknown, baseUrl: string): string | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as { url?: string | null };
  if (!v.url) return null;
  if (/^https?:\/\//i.test(v.url)) return v.url;
  const base = baseUrl.replace(/\/$/, '');
  return `${base}${v.url.startsWith('/') ? v.url : `/${v.url}`}`;
}

function resolveLinkHref(fields: Record<string, unknown> | undefined): string {
  if (!fields) return '#';
  if (fields.linkType === 'internal' && fields.doc) {
    const doc = fields.doc as {
      relationTo?: string;
      value?: { slug?: string } | string | number;
    };
    const value = doc.value;
    if (value && typeof value === 'object' && typeof value.slug === 'string' && value.slug) {
      const parts = value.slug.split('/').filter(Boolean).map(encodeURIComponent);
      if (doc.relationTo === 'posts') return `/blog/${parts.join('/')}`;
      return `/${parts.join('/')}`;
    }
  }
  const url = typeof fields.url === 'string' ? fields.url.trim() : '';
  return url || '#';
}

function inlineNodesToHtml(nodes: unknown[], baseUrl: string): string {
  return nodes
    .map((node) => {
      if (!node || typeof node !== 'object') return '';
      const n = node as Record<string, unknown>;
      const type = typeof n.type === 'string' ? n.type : '';

      if (type === 'text') {
        const raw = typeof n.text === 'string' ? n.text : '';
        if (!raw) return '';
        const format = typeof n.format === 'number' ? n.format : 0;
        const style = typeof n.style === 'string' ? n.style : '';
        return applyTextFormat(escapeHtml(raw), format, style);
      }

      if (type === 'link') {
        const fields = n.fields as Record<string, unknown> | undefined;
        const href = resolveLinkHref(fields);
        const inner = Array.isArray(n.children) ? inlineNodesToHtml(n.children, baseUrl) : '';
        if (!inner) return '';
        const newTab = fields?.newTab === true;
        const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeAttr(href)}"${target}>${inner}</a>`;
      }

      if (type === 'linebreak') return '<br />';

      if (type === 'upload' && n.value) {
        const imgUrl = mediaValueToUrl(n.value, baseUrl);
        if (!imgUrl) return '';
        const alt =
          typeof n.value === 'object' && n.value && 'alt' in n.value
            ? escapeAttr(String((n.value as { alt?: string }).alt || ''))
            : '';
        return `<img src="${escapeAttr(imgUrl)}" alt="${alt}" />`;
      }

      if (Array.isArray(n.children)) return inlineNodesToHtml(n.children, baseUrl);
      return '';
    })
    .join('');
}

function blockToHtml(node: Record<string, unknown>, baseUrl: string): string {
  const type = typeof node.type === 'string' ? node.type : '';
  const children = Array.isArray(node.children) ? node.children : [];

  if (type === 'paragraph') {
    const inner = inlineNodesToHtml(children, baseUrl);
    return inner.trim() ? `<p>${inner}</p>` : '';
  }

  if (type === 'heading') {
    const tag = typeof node.tag === 'string' ? node.tag : 'h2';
    const inner = inlineNodesToHtml(children, baseUrl);
    return inner.trim() ? `<${tag}>${inner}</${tag}>` : '';
  }

  if (type === 'list') {
    const items = children
      .map((li) => {
        if (!li || typeof li !== 'object') return '';
        const liNode = li as Record<string, unknown>;
        const inner = Array.isArray(liNode.children)
          ? inlineNodesToHtml(liNode.children, baseUrl)
          : '';
        return inner.trim() ? `<li>${inner}</li>` : '';
      })
      .join('');
    if (!items) return '';
    const listTag = node.listType === 'number' ? 'ol' : 'ul';
    return `<${listTag}>${items}</${listTag}>`;
  }

  if (type === 'quote') {
    const inner = inlineNodesToHtml(children, baseUrl);
    return inner.trim() ? `<blockquote>${inner}</blockquote>` : '';
  }

  if (type === 'upload' && node.value) {
    const imgUrl = mediaValueToUrl(node.value, baseUrl);
    if (!imgUrl) return '';
    const alt =
      typeof node.value === 'object' && node.value && 'alt' in node.value
        ? escapeAttr(String((node.value as { alt?: string }).alt || ''))
        : '';
    return `<p><img src="${escapeAttr(imgUrl)}" alt="${alt}" /></p>`;
  }

  if (type === 'horizontalrule') return '<hr />';

  if (type === 'block' && node.fields && typeof node.fields === 'object') {
    const fields = node.fields as Record<string, unknown>;
    if (fields.blockType === 'mediaBlock' && fields.media) {
      const imgUrl = mediaValueToUrl(fields.media, baseUrl);
      if (imgUrl) return `<p><img src="${escapeAttr(imgUrl)}" alt="" /></p>`;
    }
    if (fields.content) {
      return cmsLexicalToHtml({ root: fields.content }, baseUrl);
    }
  }

  const fallback = inlineNodesToHtml(children, baseUrl);
  return fallback.trim() ? `<p>${fallback}</p>` : '';
}

export function cmsLexicalToHtml(value: unknown, mediaBaseUrl?: string): string {
  if (!value || typeof value !== 'object') return '';

  const root =
    (value as Record<string, unknown>).root ??
    ((value as Record<string, unknown>).content as Record<string, unknown> | undefined)?.root;

  const rootNode = root as Record<string, unknown> | undefined;
  const children = Array.isArray(rootNode?.children) ? rootNode.children : [];
  if (!children.length) return '';

  const base =
    mediaBaseUrl ||
    process.env.PAYLOAD_CMS_URL ||
    'https://argroup-education-cms-livid.vercel.app';

  return children
    .map((child) => {
      if (!child || typeof child !== 'object') return '';
      return blockToHtml(child as Record<string, unknown>, base);
    })
    .filter(Boolean)
    .join('\n');
}
