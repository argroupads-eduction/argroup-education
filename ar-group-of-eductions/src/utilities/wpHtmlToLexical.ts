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

  return out
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
    return convertHTMLToLexical({
      editorConfig,
      html: cleaned,
      JSDOM,
    })
  } catch {
    const fallback = stripTags(cleaned).slice(0, 8000)
    return convertHTMLToLexical({
      editorConfig,
      html: fallback ? `<p>${fallback}</p>` : '<p>Content imported from WordPress.</p>',
      JSDOM,
    })
  }
}
