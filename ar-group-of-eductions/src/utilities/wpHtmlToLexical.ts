import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { SanitizedConfig } from 'payload'
import { JSDOM } from 'jsdom'

import { marketingContentLexicalFeatures } from '@/fields/contentLexicalEditor'

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normUrl(url: string): string {
  return url
    .replace(/^https?:\/\/(www\.)?argroupofeducation\.com/i, '')
    .replace(/-\d+x\d+(?=\.[a-z]+$)/i, '')
    .replace(/elementor\/thumbs\//i, 'uploads/')
    .split('?')[0]
    .toLowerCase()
}

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const SITE_ORIGIN = 'https://www.argroupofeducation.com'

function normalizeExternalUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed || trimmed === '#') return null
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('/')) return `${SITE_ORIGIN}${trimmed}`
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`
  try {
    return new URL(trimmed).href
  } catch {
    return null
  }
}

function sanitizeAnchorTags(html: string): string {
  return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_match, attrs: string, inner: string) => {
    const href = attrs.match(/\bhref=["']([^"']*)["']/i)?.[1] ?? ''
    const normalized = normalizeExternalUrl(href)
    if (!normalized) return inner
    return `<a href="${normalized.replace(/"/g, '&quot;')}">${inner}</a>`
  })
}

/** Lexical upload nodes require a media ID; WP inline images become external links. */
function inlineImagesToLinks(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (match) => {
    const src = match.match(/\bsrc=["']([^"']+)["']/i)?.[1]
    const alt = match.match(/\balt=["']([^"']*)["']/i)?.[1]?.trim() || 'View image'
    const normalized = src ? normalizeExternalUrl(src) : null
    if (!normalized) return ''
    return `<p><a href="${normalized.replace(/"/g, '&quot;')}">${escapeHtmlText(alt)}</a></p>`
  })
}

function isValidUploadId(value: unknown): boolean {
  if (typeof value === 'number' && Number.isFinite(value)) return true
  if (typeof value === 'string' && /^\d+$/.test(value)) return true
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id
    return typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))
  }
  return false
}

function stripInvalidUploadNodes<T extends { root?: { children?: unknown[] } }>(lexical: T): T {
  const walk = (nodes: unknown[]): unknown[] => {
    const out: unknown[] = []
    for (const raw of nodes) {
      if (!raw || typeof raw !== 'object') continue
      const node = raw as Record<string, unknown>
      if (node.type === 'upload' && !isValidUploadId(node.value)) continue
      if (Array.isArray(node.children)) {
        node.children = walk(node.children)
      }
      out.push(node)
    }
    return out
  }

  const root = lexical?.root
  if (root && Array.isArray(root.children)) {
    root.children = walk(root.children)
  }
  return lexical
}

function urlsMatch(a: string, b: string): boolean {
  const na = normUrl(a)
  const nb = normUrl(b)
  return na === nb || na.includes(nb) || nb.includes(na)
}

/** Strip Elementor wrappers; keep headings, paragraphs, lists, tables, images. */
export function simplifyElementorHtml(
  html: string,
  options?: { featuredImageUrl?: string | null; title?: string | null },
): string {
  let out = html

  out = out.replace(/<script[\s\S]*?<\/script>/gi, '')
  out = out.replace(/<style[\s\S]*?<\/style>/gi, '')
  out = out.replace(/<svg[\s\S]*?<\/svg>/gi, '')

  out = out.replace(
    /<ul[^>]*elementor-icon-list-items[^>]*>([\s\S]*?)<\/ul>/gi,
    (_, inner: string) => {
      const items = [...inner.matchAll(/elementor-icon-list-text[^>]*>([\s\S]*?)<\/span>/gi)]
        .map((m) => m[1].trim())
        .filter(Boolean)
      if (!items.length) return ''
      return `<ul>${items.map((t) => `<li>${t}</li>`).join('')}</ul>`
    },
  )

  out = out.replace(/<h1(\b[^>]*)>/gi, '<h2$1>').replace(/<\/h1>/gi, '</h2>')

  if (options?.title) {
    const plain = stripTags(options.title).toLowerCase()
    if (plain) {
      out = out.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (match, inner: string) => {
        if (stripTags(inner).toLowerCase() === plain) return ''
        return match
      })
    }
  }

  if (options?.featuredImageUrl) {
    let removed = 0
    out = out.replace(/<img\b[^>]*>/gi, (match) => {
      if (removed >= 1) return match
      const src = match.match(/\bsrc=["']([^"']+)["']/i)?.[1]
      if (src && urlsMatch(src, options.featuredImageUrl!)) {
        removed++
        return ''
      }
      return match
    })
  }

  out = out.replace(/\sdata-elementor[^=]*="[^"]*"/gi, '')
  out = out.replace(/\sdata-eae-slider="[^"]*"/gi, '')
  out = out.replace(/\sdata-id="[^"]*"/gi, '')
  out = out.replace(/\sdata-element_type="[^"]*"/gi, '')
  out = out.replace(/\sdata-e-type="[^"]*"/gi, '')
  out = out.replace(/\sdata-widget_type="[^"]*"/gi, '')

  return sanitizeAnchorTags(inlineImagesToLinks(out))
}

let cachedEditorConfig: Awaited<ReturnType<typeof editorConfigFactory.fromFeatures>> | null = null

async function getMarketingEditorConfig(config: SanitizedConfig) {
  if (cachedEditorConfig) return cachedEditorConfig
  cachedEditorConfig = await editorConfigFactory.fromFeatures({
    config,
    features: marketingContentLexicalFeatures,
  })
  return cachedEditorConfig
}

const MAX_HTML_CHARS = 400_000

export async function wpHtmlToLexical(
  html: string,
  config: SanitizedConfig,
  options?: { featuredImageUrl?: string | null; title?: string | null },
): Promise<ReturnType<typeof convertHTMLToLexical>> {
  const cleaned = simplifyElementorHtml(html, options).slice(0, MAX_HTML_CHARS)
  const editorConfig = await getMarketingEditorConfig(config)

  try {
    return stripInvalidUploadNodes(
      await convertHTMLToLexical({
        editorConfig,
        html: cleaned,
        JSDOM,
      }),
    )
  } catch {
    const fallback = stripTags(cleaned).slice(0, 8000)
    return stripInvalidUploadNodes(
      await convertHTMLToLexical({
        editorConfig,
        html: fallback ? `<p>${fallback}</p>` : '<p>Content imported from WordPress.</p>',
        JSDOM,
      }),
    )
  }
}
