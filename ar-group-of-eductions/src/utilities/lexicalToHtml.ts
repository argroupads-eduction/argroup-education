import { hasSubstantialLexicalContent } from './lexicalContent'

/** Lexical rich text → HTML with links, bold, italic, underline, colors, images. */

const F_BOLD = 1
const F_ITALIC = 2
const F_STRIKETHROUGH = 4
const F_UNDERLINE = 8
const F_CODE = 16

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function mediaValueToUrl(value: unknown, baseUrl: string): string | null {
  if (!value || typeof value !== 'object') return null
  const v = value as { url?: string | null }
  if (!v.url) return null
  if (/^https?:\/\//i.test(v.url)) return v.url
  const base = baseUrl.replace(/\/$/, '')
  return `${base}${v.url.startsWith('/') ? v.url : `/${v.url}`}`
}

function resolveLinkHref(fields: Record<string, unknown> | undefined): string {
  if (!fields) return '#'

  if (fields.linkType === 'internal' && fields.doc) {
    const doc = fields.doc as {
      relationTo?: string
      value?: { slug?: string } | string | number
    }
    const value = doc.value
    if (value && typeof value === 'object' && typeof value.slug === 'string' && value.slug) {
      const parts = value.slug.split('/').filter(Boolean).map(encodeURIComponent)
      if (doc.relationTo === 'posts') return `/blog/${parts.join('/')}`
      return `/${parts.join('/')}`
    }
  }

  const url = typeof fields.url === 'string' ? fields.url.trim() : ''
  return url || '#'
}

function applyTextFormat(html: string, format: number, style: string): string {
  let out = html
  if (format & F_CODE) out = `<code>${out}</code>`
  if (format & F_BOLD) out = `<strong>${out}</strong>`
  if (format & F_ITALIC) out = `<em>${out}</em>`
  if (format & F_STRIKETHROUGH) out = `<s>${out}</s>`
  if (format & F_UNDERLINE) out = `<u>${out}</u>`
  if (style.trim()) {
    out = `<span style="${escapeAttr(style.trim())}">${out}</span>`
  }
  return out
}

function inlineNodesToHtml(nodes: unknown[], baseUrl: string): string {
  return nodes
    .map((node) => {
      if (!node || typeof node !== 'object') return ''
      const n = node as Record<string, unknown>
      const type = typeof n.type === 'string' ? n.type : ''

      if (type === 'text') {
        const raw = typeof n.text === 'string' ? n.text : ''
        if (!raw) return ''
        const format = typeof n.format === 'number' ? n.format : 0
        const style = typeof n.style === 'string' ? n.style : ''
        return applyTextFormat(escapeHtml(raw), format, style)
      }

      if (type === 'link') {
        const fields = n.fields as Record<string, unknown> | undefined
        const href = resolveLinkHref(fields)
        const inner = Array.isArray(n.children) ? inlineNodesToHtml(n.children, baseUrl) : ''
        if (!inner) return ''
        const newTab = fields?.newTab === true
        const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
        return `<a href="${escapeAttr(href)}"${target}>${inner}</a>`
      }

      if (type === 'linebreak') return '<br />'

      if (type === 'upload' && n.value) {
        const imgUrl = mediaValueToUrl(n.value, baseUrl)
        if (!imgUrl) return ''
        const alt =
          typeof n.value === 'object' && n.value && 'alt' in n.value
            ? escapeAttr(String((n.value as { alt?: string }).alt || ''))
            : ''
        return `<img src="${escapeAttr(imgUrl)}" alt="${alt}" />`
      }

      if (Array.isArray(n.children)) {
        return inlineNodesToHtml(n.children, baseUrl)
      }

      return ''
    })
    .join('')
}

function lexicalTableToHtml(node: Record<string, unknown>): string {
  const rows = Array.isArray(node.children) ? node.children : []
  if (!rows.length) return ''

  const rowHtml = rows
    .map((row) => {
      if (!row || typeof row !== 'object') return ''
      const cells = Array.isArray((row as Record<string, unknown>).children)
        ? ((row as Record<string, unknown>).children as unknown[])
        : []
      if (!cells.length) return ''

      const cellHtml = cells
        .map((cell) => {
          if (!cell || typeof cell !== 'object') return ''
          const c = cell as Record<string, unknown>
          const inner = Array.isArray(c.children)
            ? inlineNodesToHtml(c.children, '')
            : ''
          if (!inner.trim()) return ''
          const isHeader = c.headerState === 'row' || c.headerState === 'both'
          const tag = isHeader ? 'th' : 'td'
          return `<${tag}>${inner}</${tag}>`
        })
        .join('')

      return cellHtml ? `<tr>${cellHtml}</tr>` : ''
    })
    .filter(Boolean)
    .join('')

  return rowHtml ? `<table>${rowHtml}</table>` : ''
}

function blockToHtml(node: Record<string, unknown>, baseUrl: string): string {
  const type = typeof node.type === 'string' ? node.type : ''
  const children = Array.isArray(node.children) ? node.children : []

  if (type === 'paragraph') {
    const inner = inlineNodesToHtml(children, baseUrl)
    return inner.trim() ? `<p>${inner}</p>` : ''
  }

  if (type === 'heading') {
    const tag = typeof node.tag === 'string' ? node.tag : 'h2'
    const inner = inlineNodesToHtml(children, baseUrl)
    return inner.trim() ? `<${tag}>${inner}</${tag}>` : ''
  }

  if (type === 'list') {
    const items = children
      .map((li) => {
        if (!li || typeof li !== 'object') return ''
        const liNode = li as Record<string, unknown>
        const inner = Array.isArray(liNode.children)
          ? inlineNodesToHtml(liNode.children, baseUrl)
          : ''
        return inner.trim() ? `<li>${inner}</li>` : ''
      })
      .join('')
    if (!items) return ''
    const listTag = node.listType === 'number' ? 'ol' : 'ul'
    return `<${listTag}>${items}</${listTag}>`
  }

  if (type === 'quote') {
    const inner = inlineNodesToHtml(children, baseUrl)
    return inner.trim() ? `<blockquote>${inner}</blockquote>` : ''
  }

  if (type === 'table') {
    return lexicalTableToHtml(node)
  }

  if (type === 'upload' && node.value) {
    const imgUrl = mediaValueToUrl(node.value, baseUrl)
    if (!imgUrl) return ''
    const alt =
      typeof node.value === 'object' && node.value && 'alt' in node.value
        ? escapeAttr(String((node.value as { alt?: string }).alt || ''))
        : ''
    return `<p><img src="${escapeAttr(imgUrl)}" alt="${alt}" /></p>`
  }

  if (type === 'horizontalrule') {
    return '<hr />'
  }

  if (type === 'block' && node.fields && typeof node.fields === 'object') {
    const fields = node.fields as Record<string, unknown>
    if (fields.blockType === 'mediaBlock' && fields.media) {
      const imgUrl = mediaValueToUrl(fields.media, baseUrl)
      if (imgUrl) {
        return `<p><img src="${escapeAttr(imgUrl)}" alt="" /></p>`
      }
    }
    if (fields.content) {
      return lexicalToHtml({ root: fields.content }, baseUrl)
    }
  }

  const fallback = inlineNodesToHtml(children, baseUrl)
  return fallback.trim() ? `<p>${fallback}</p>` : ''
}

export function lexicalToHtml(value: unknown, mediaBaseUrl?: string): string {
  if (!value || typeof value !== 'object') return ''

  const root =
    (value as Record<string, unknown>).root ??
    ((value as Record<string, unknown>).content as Record<string, unknown> | undefined)?.root

  const rootNode = root as Record<string, unknown> | undefined
  const children = Array.isArray(rootNode?.children) ? rootNode.children : []
  if (!children.length) return ''

  const base = mediaBaseUrl || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000'

  return children
    .map((child) => {
      if (!child || typeof child !== 'object') return ''
      return blockToHtml(child as Record<string, unknown>, base)
    })
    .filter(Boolean)
    .join('\n')
}

function payloadLinkToHref(link: Record<string, unknown> | undefined): string {
  if (!link) return '#'

  if (link.type === 'custom') {
    const url = typeof link.url === 'string' ? link.url.trim() : ''
    return url || '#'
  }

  const ref = link.reference as
    | { relationTo?: string; value?: { slug?: string } | string | number }
    | undefined
  const value = ref?.value
  if (value && typeof value === 'object' && typeof value.slug === 'string' && value.slug) {
    const parts = value.slug.split('/').filter(Boolean).map(encodeURIComponent)
    if (ref?.relationTo === 'posts') return `/blog/${parts.join('/')}`
    return `/${parts.join('/')}`
  }

  return '#'
}

const DEFAULT_PAGE_ENQUIRY_CTA = `<div class="wp-premium-enquiry">
  <p class="wp-premium-enquiry-text">Speak with our admission counsellors for personalised guidance on fees, eligibility, and seat booking.</p>
  <div class="wp-premium-enquiry-actions">
    <a href="/contact" class="wp-premium-btn wp-premium-btn-primary">Book free counselling</a>
    <a href="tel:+917076909090" class="wp-premium-btn wp-premium-btn-outline">Call +91-7076909090</a>
  </div>
</div>`

function layoutBlockToHtml(block: Record<string, unknown>, baseUrl: string): string {
  const blockType = typeof block.blockType === 'string' ? block.blockType : ''

  if (blockType === 'content') {
    const columns = block.columns as Array<{ richText?: unknown }> | undefined
    return (columns ?? [])
      .map((col) => lexicalToHtml(col.richText, baseUrl))
      .filter(Boolean)
      .join('\n')
  }

  if (blockType === 'cta') {
    const textHtml = lexicalToHtml(block.richText, baseUrl)
    const links = block.links as Array<{ link?: Record<string, unknown> }> | undefined
    const buttons = (links ?? [])
      .map((item) => {
        const link = item.link
        if (!link || typeof link.label !== 'string' || !link.label.trim()) return ''
        const href = payloadLinkToHref(link)
        const appearance =
          link.appearance === 'outline' ? 'wp-premium-btn-outline' : 'wp-premium-btn-primary'
        const target = link.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
        return `<a href="${escapeAttr(href)}" class="wp-premium-btn ${appearance}"${target}>${escapeHtml(link.label.trim())}</a>`
      })
      .filter(Boolean)
      .join('')

    if (buttons) {
      const intro = textHtml.trim()
        ? `<div class="wp-premium-enquiry-text">${textHtml}</div>`
        : `<p class="wp-premium-enquiry-text">Speak with our admission counsellors for personalised guidance on fees, eligibility, and seat booking.</p>`
      return `<div class="wp-premium-enquiry">${intro}<div class="wp-premium-enquiry-actions">${buttons}</div></div>`
    }

    return textHtml
  }

  if (blockType === 'mediaBlock') {
    const imgUrl = mediaValueToUrl(block.media, baseUrl)
    if (!imgUrl) return ''
    const alt =
      typeof block.media === 'object' && block.media && 'alt' in block.media
        ? escapeAttr(String((block.media as { alt?: string }).alt || ''))
        : ''
    return `<p><img src="${escapeAttr(imgUrl)}" alt="${alt}" /></p>`
  }

  if (blockType === 'formBlock') {
    return DEFAULT_PAGE_ENQUIRY_CTA
  }

  return ''
}

export function layoutToHtml(layout: unknown, mediaBaseUrl?: string): string {
  if (!Array.isArray(layout)) return ''

  const base = mediaBaseUrl || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000'

  return layout
    .map((block) => {
      if (!block || typeof block !== 'object') return ''
      return layoutBlockToHtml(block as Record<string, unknown>, base)
    })
    .filter(Boolean)
    .join('\n')
}

export function htmlFromPayloadDoc(doc: {
  htmlContent?: string | null
  content?: unknown
  layout?: unknown
  hero?: { richText?: unknown } | null
}): string {
  const htmlContent =
    typeof doc.htmlContent === 'string' ? doc.htmlContent.trim() : ''
  const fromContent = lexicalToHtml(doc.content)

  // Imported WP pages: full HTML body is the source of truth when present.
  if (htmlContent.length > 400) {
    return htmlContent
  }

  if (hasSubstantialLexicalContent(doc.content) && fromContent.trim()) {
    return fromContent
  }

  if (htmlContent) {
    return htmlContent
  }

  if (fromContent.trim()) return fromContent

  const heroHtml = lexicalToHtml(doc.hero?.richText)
  const layoutHtml = layoutToHtml(doc.layout)

  if (heroHtml.trim() && layoutHtml.trim()) {
    return `${heroHtml}\n${layoutHtml}`
  }

  return heroHtml.trim() || layoutHtml
}
