import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import type { CollectionAfterReadHook, Payload } from 'payload'

import { hasSubstantialLexicalContent } from '@/utilities/lexicalContent'
import { wpHtmlToLexical } from '@/utilities/wpHtmlToLexical'

const MEDIA_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../public/media',
)

type VisualDoc = {
  id: number | string
  slug?: string | null
  title?: string | null
  htmlContent?: string | null
  content?: unknown
  featuredImage?: number | string | null
  featuredImageUrl?: string | null
  ogImageUrl?: string | null
  heroImage?: number | string | null
  layout?: unknown
}

function isAdminSingleDocRequest(url: string | undefined): boolean {
  if (!url) return false
  const pathOnly = url.split('?')[0] ?? ''
  return /\/api\/(pages|posts)\/[^/]+$/.test(pathOnly)
}

function imageUrlFromDoc(doc: VisualDoc): string | null {
  for (const raw of [doc.featuredImageUrl, doc.ogImageUrl]) {
    if (typeof raw === 'string' && raw.trim().startsWith('http')) return raw.trim()
  }
  return null
}

function isPlaceholderLayout(layout: unknown): boolean {
  if (!Array.isArray(layout) || layout.length !== 1) return false
  const block = layout[0] as { blockType?: string }
  return block?.blockType === 'content'
}

function filenameFromUrl(url: string, slug: string): string {
  try {
    const u = new URL(url)
    const base = path.basename(u.pathname)
    if (base && base.includes('.')) return base.replace(/[^a-zA-Z0-9._-]/g, '-')
  } catch {
    /* fall through */
  }
  return `${slug}-featured.jpg`
}

async function downloadToFile(url: string, dest: string): Promise<boolean> {
  const res = await fetch(url, { signal: AbortSignal.timeout(90_000) })
  if (!res.ok || !res.body) return false
  await pipeline(
    Readable.fromWeb(res.body as import('node:stream/web').ReadableStream),
    createWriteStream(dest),
  )
  return true
}

async function ensureMedia(
  payload: Payload,
  url: string,
  slug: string,
  alt: string,
): Promise<number | null> {
  const filename = filenameFromUrl(url, slug)

  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    pagination: false,
    depth: 0,
  })
  if (existing.docs[0]?.id) return existing.docs[0].id as number

  await mkdir(MEDIA_DIR, { recursive: true })
  const filePath = path.join(MEDIA_DIR, filename)
  const ok = await downloadToFile(url, filePath)
  if (!ok) return null

  const doc = await payload.create({
    collection: 'media',
    data: { alt: alt.slice(0, 120) },
    filePath,
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
  return doc.id as number
}

async function migrateDocIfNeeded(
  payload: Payload,
  collection: 'pages' | 'posts',
  doc: VisualDoc,
): Promise<VisualDoc> {
  const html =
    typeof doc.htmlContent === 'string' && doc.htmlContent.trim() ? doc.htmlContent.trim() : ''
  const imageUrl = imageUrlFromDoc(doc)
  const imageField = collection === 'posts' ? 'heroImage' : 'featuredImage'
  const currentImageId = collection === 'posts' ? doc.heroImage : doc.featuredImage

  const needsContent = html && !hasSubstantialLexicalContent(doc.content)
  const needsImage = Boolean(imageUrl && !currentImageId)
  const needsLayoutCleanup = collection === 'pages' && isPlaceholderLayout(doc.layout)

  if (!needsContent && !needsImage && !needsLayoutCleanup) return doc

  const data: Record<string, unknown> = {}

  if (needsContent) {
    data.content = await wpHtmlToLexical(html, payload.config, {
      featuredImageUrl: imageUrl,
      title: typeof doc.title === 'string' ? doc.title : null,
    })
    doc.content = data.content
  }

  if (needsImage && imageUrl) {
    const mediaId = await ensureMedia(
      payload,
      imageUrl,
      String(doc.slug ?? doc.id),
      String(doc.title ?? doc.slug ?? 'Featured image'),
    )
    if (mediaId) {
      data[imageField] = mediaId
      if (!doc.featuredImageUrl) data.featuredImageUrl = imageUrl
      if (collection === 'posts') doc.heroImage = mediaId
      else doc.featuredImage = mediaId
    }
  }

  if (needsLayoutCleanup) {
    data.layout = []
    doc.layout = []
  }

  if (Object.keys(data).length > 0) {
    await payload.update({
      collection,
      id: doc.id,
      data,
      overrideAccess: true,
      context: { disableBackendSync: true, disableRevalidate: true, disableVisualMigration: true },
    })
  }

  return doc
}

export function migrateVisualContentOnRead(
  collection: 'pages' | 'posts',
): CollectionAfterReadHook {
  return async ({ doc, req }) => {
    if (!req.user || !doc || req.context?.disableVisualMigration) return doc
    if (!isAdminSingleDocRequest(req.url)) return doc

    try {
      return await migrateDocIfNeeded(req.payload, collection, doc as VisualDoc)
    } catch {
      return doc
    }
  }
}
