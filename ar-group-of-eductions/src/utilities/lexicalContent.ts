/** Detect whether Lexical `content` is real body copy vs import placeholder. */

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function lexicalRootChildren(content: unknown): unknown[] {
  if (!content || typeof content !== 'object') return []
  const root = (content as { root?: { children?: unknown[] } }).root
  return Array.isArray(root?.children) ? root.children : []
}

function lexicalHasHeading(content: unknown): boolean {
  const walk = (nodes: unknown[]): boolean => {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue
      const n = node as { type?: string; children?: unknown[] }
      if (n.type === 'heading') return true
      if (Array.isArray(n.children) && walk(n.children)) return true
    }
    return false
  }
  return walk(lexicalRootChildren(content))
}

function plainTextFromLexical(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const root = (content as { root?: { children?: unknown[] } }).root
  const parts: string[] = []

  const walk = (nodes: unknown[]) => {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue
      const n = node as { type?: string; text?: string; children?: unknown[] }
      if (n.type === 'text' && typeof n.text === 'string') parts.push(n.text)
      if (Array.isArray(n.children)) walk(n.children)
    }
  }

  if (Array.isArray(root?.children)) walk(root.children)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

const PLACEHOLDER_PREFIX = 'Content imported from WordPress'

export function isPlaceholderLexicalContent(content: unknown): boolean {
  const text = plainTextFromLexical(content)
  if (!text) return true
  if (text.startsWith(PLACEHOLDER_PREFIX) && text.length < 600) return true
  return false
}

/** WP import stored full HTML in `htmlContent` but only a short excerpt in `content`. */
export function needsLegacyHtmlConversion(
  content: unknown,
  htmlContent?: string | null,
): boolean {
  const html = typeof htmlContent === 'string' ? htmlContent.trim() : ''
  if (!html || !/<(div|p|h[1-6]|table|section|article|ul|ol)\b/i.test(html)) return false

  if (isPlaceholderLexicalContent(content)) return true

  const children = lexicalRootChildren(content)
  if (children.length === 0) return true

  if (lexicalHasHeading(content)) return false

  const lexicalText = plainTextFromLexical(content)
  const htmlText = stripHtml(html)
  return htmlText.length > lexicalText.length * 1.3 + 150
}

export function hasSubstantialLexicalContent(
  content: unknown,
  htmlContent?: string | null,
): boolean {
  if (needsLegacyHtmlConversion(content, htmlContent)) return false
  if (!content || typeof content !== 'object') return false
  const root = (content as { root?: { children?: unknown[] } }).root
  const children = root?.children
  if (!Array.isArray(children) || children.length === 0) return false
  if (isPlaceholderLexicalContent(content)) return false

  const text = plainTextFromLexical(content)
  return text.length > 120 || children.length > 1
}
