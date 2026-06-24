import type {
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  SanitizedConfig,
} from 'payload'

import {
  hasSubstantialLexicalContent,
  needsLegacyHtmlConversion,
} from '@/utilities/lexicalContent'

type LegacyBodyDoc = {
  title?: string | null
  htmlContent?: string | null
  content?: unknown
  featuredImageUrl?: string | null
}

function importedHtml(html: unknown): string {
  if (typeof html !== 'string') return ''
  const trimmed = html.trim()
  if (!trimmed) return ''
  if (!/<(div|p|h[1-6]|table|section|article|ul|ol)\b/i.test(trimmed)) return ''
  return trimmed
}

async function htmlToEditorLexical(
  doc: LegacyBodyDoc,
  config: SanitizedConfig,
): Promise<unknown | null> {
  const html = importedHtml(doc.htmlContent)
  if (!html) return null

  const { wpHtmlToLexical } = await import('@/utilities/wpHtmlToLexical')
  return wpHtmlToLexical(html, config, {
    featuredImageUrl:
      typeof doc.featuredImageUrl === 'string' ? doc.featuredImageUrl : null,
    title: typeof doc.title === 'string' ? doc.title : null,
  })
}

/** Admin edit screen: show headings/paragraphs in the visual editor instead of raw HTML. */
export const hydrateLegacyHtmlAfterRead: CollectionAfterReadHook = async ({
  doc,
  req,
  findMany,
}) => {
  if (findMany || !req.user || req.context?.disableLegacyHydration) return doc

  const body = doc as LegacyBodyDoc
  if (!needsLegacyHtmlConversion(body.content, body.htmlContent)) return doc

  const html = importedHtml(body.htmlContent)
  if (!html) return doc

  try {
    const lexical = await htmlToEditorLexical(body, req.payload.config)
    if (!lexical) return doc
    return { ...doc, content: lexical }
  } catch (err) {
    req.payload.logger.warn({ err }, '[legacyHtml] hydrate afterRead failed')
    return doc
  }
}

/** On save/publish: visual editor wins; convert legacy HTML once if still a placeholder. */
export const promoteLexicalBodyOnSave: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (req.context?.disableLegacyHydration) return data

  const next = data as LegacyBodyDoc
  const prev = (originalDoc ?? {}) as LegacyBodyDoc

  if (hasSubstantialLexicalContent(next.content, next.htmlContent ?? prev.htmlContent)) {
    next.htmlContent = null
    return next
  }

  const html = importedHtml(next.htmlContent) || importedHtml(prev.htmlContent)
  if (!html) return next

  const content = next.content ?? prev.content
  if (!needsLegacyHtmlConversion(content, next.htmlContent ?? prev.htmlContent)) {
    return next
  }

  try {
    const lexical = await htmlToEditorLexical(
      {
        title: (next.title as string | undefined) ?? prev.title,
        htmlContent: html,
        featuredImageUrl:
          (next.featuredImageUrl as string | undefined) ?? prev.featuredImageUrl,
      },
      req.payload.config,
    )
    if (lexical) next.content = lexical
  } catch (err) {
    req.payload.logger.warn({ err }, '[legacyHtml] beforeChange convert failed')
  }

  return next
}
