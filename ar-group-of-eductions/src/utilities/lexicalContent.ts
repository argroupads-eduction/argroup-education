/** Detect whether Lexical `content` is real body copy vs import placeholder. */

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

export function hasSubstantialLexicalContent(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false
  const root = (content as { root?: { children?: unknown[] } }).root
  const children = root?.children
  if (!Array.isArray(children) || children.length === 0) return false
  if (isPlaceholderLexicalContent(content)) return false

  const text = plainTextFromLexical(content)
  return text.length > 120 || children.length > 1
}
