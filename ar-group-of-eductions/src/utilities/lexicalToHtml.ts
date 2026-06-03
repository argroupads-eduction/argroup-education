/** Lexical rich text → HTML for marketing site sync (mirrors apps/frontend/lib/contentApi.ts). */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function lexicalNodeToText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as Record<string, unknown>
  if (typeof n.text === 'string') return n.text
  if (Array.isArray(n.children)) {
    return n.children.map(lexicalNodeToText).join('')
  }
  return ''
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
          const text = escapeHtml(lexicalNodeToText(c).trim())
          if (!text) return ''
          const isHeader = c.headerState === 'row' || c.headerState === 'both'
          const tag = isHeader ? 'th' : 'td'
          return `<${tag}>${text}</${tag}>`
        })
        .join('')

      return cellHtml ? `<tr>${cellHtml}</tr>` : ''
    })
    .filter(Boolean)
    .join('')

  return rowHtml ? `<table>${rowHtml}</table>` : ''
}

function mediaValueToUrl(value: unknown, baseUrl: string): string | null {
  if (!value || typeof value !== 'object') return null
  const v = value as { url?: string | null }
  if (!v.url) return null
  if (/^https?:\/\//i.test(v.url)) return v.url
  const base = baseUrl.replace(/\/$/, '')
  return `${base}${v.url.startsWith('/') ? v.url : `/${v.url}`}`
}

export function lexicalToHtml(value: unknown, mediaBaseUrl?: string): string {
  if (!value || typeof value !== 'object') return ''
  const root = (value as Record<string, unknown>).root as Record<string, unknown> | undefined
  const children = Array.isArray(root?.children) ? root.children : []
  if (!children.length) return ''

  const base = mediaBaseUrl || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000'
  const blocks: string[] = []

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (!child || typeof child !== 'object') continue

    const n = child as Record<string, unknown>
    const type = typeof n.type === 'string' ? n.type : ''

    if (type === 'upload' && n.value) {
      const imgUrl = mediaValueToUrl(n.value, base)
      if (imgUrl) {
        const alt =
          typeof n.value === 'object' && n.value && 'alt' in n.value
            ? escapeHtml(String((n.value as { alt?: string }).alt || ''))
            : ''
        blocks.push(`<p><img src="${escapeHtml(imgUrl)}" alt="${alt}" /></p>`)
      }
      continue
    }

    const rawText = lexicalNodeToText(child).trim()
    const text = escapeHtml(rawText)
    if (!text) continue

    if (type === 'heading') {
      const tag = typeof n.tag === 'string' ? n.tag : 'h2'
      blocks.push(`<${tag}>${text}</${tag}>`)
      continue
    }

    if (type === 'list' && Array.isArray(n.children)) {
      const items = n.children
        .map((li) => `<li>${escapeHtml(lexicalNodeToText(li).trim())}</li>`)
        .join('')
      const listTag = n.listType === 'number' ? 'ol' : 'ul'
      blocks.push(`<${listTag}>${items}</${listTag}>`)
      continue
    }

    if (type === 'table') {
      const tableHtml = lexicalTableToHtml(n)
      if (tableHtml) blocks.push(tableHtml)
      continue
    }

    blocks.push(`<p>${text}</p>`)
  }

  return blocks.filter(Boolean).join('')
}

export function htmlFromPayloadDoc(doc: {
  htmlContent?: string | null
  content?: unknown
}): string {
  if (typeof doc.htmlContent === 'string' && doc.htmlContent.trim()) {
    return doc.htmlContent
  }
  return lexicalToHtml(doc.content)
}
