/**
 * Fill Payload admin with live-site content + featured images for all pages/posts.
 *
 * - Converts hidden `htmlContent` → visual `content` (Lexical)
 * - Downloads WP featured image → `featuredImage` / `heroImage` upload field
 * - Clears old placeholder `layout` excerpt blocks on pages
 *
 * Usage:
 *   npx tsx scripts/backfill-cms-visual.mts
 *   npx tsx scripts/backfill-cms-visual.mts --dry-run --limit=3
 *   npx tsx scripts/backfill-cms-visual.mts --slug=shri-rawatpura-sarkar-institute-of-medical-sciences-and-research
 */

import dotenv from 'dotenv'
import { createWriteStream } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import type { Payload, Where } from 'payload'

import { needsLegacyHtmlConversion } from '../src/utilities/lexicalContent.js'
import { resolveDatabaseUrl } from '../src/utilities/resolveDatabaseUrl.js'
import { wpHtmlToLexical } from '../src/utilities/wpHtmlToLexical.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.DATABASE_URL = ''
dotenv.config({ path: path.join(__dirname, '../.env'), override: true })
process.env.DATABASE_URL = resolveDatabaseUrl()

const REPORT_DIR = path.resolve(__dirname, '../../apps/frontend/data/wp-export-bundle/reports')
const MEDIA_DIR = path.resolve(__dirname, '../public/media')

type CollectionSlug = 'pages' | 'posts'

type DocRow = {
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

function parseArgs(argv: string[]) {
  const limitMatch = argv.find((a) => a.startsWith('--limit='))
  const slugMatch = argv.find((a) => a.startsWith('--slug='))
  return {
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    pagesOnly: argv.includes('--pages-only'),
    postsOnly: argv.includes('--posts-only'),
    limit: limitMatch ? Math.max(1, parseInt(limitMatch.split('=')[1] ?? '0', 10)) : 0,
    slug: slugMatch ? slugMatch.split('=')[1] : null,
  }
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
  dryRun: boolean,
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

  if (dryRun) return -1

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

function imageUrlFromDoc(doc: DocRow): string | null {
  const candidates = [doc.featuredImageUrl, doc.ogImageUrl]
  for (const raw of candidates) {
    if (typeof raw === 'string' && raw.trim().startsWith('http')) return raw.trim()
  }
  return null
}

function isPlaceholderLayout(layout: unknown): boolean {
  if (!Array.isArray(layout) || layout.length !== 1) return false
  const block = layout[0] as { blockType?: string; columns?: Array<{ richText?: unknown }> }
  return block?.blockType === 'content'
}

async function* iterateDocs(
  payload: Payload,
  collection: CollectionSlug,
  opts: ReturnType<typeof parseArgs>,
) {
  const pageSize = 40
  let page = 1
  let yielded = 0

  while (true) {
    const where: Where = opts.slug
      ? { slug: { equals: opts.slug } }
      : { htmlContent: { exists: true } }

    const result = await payload.find({
      collection,
      where,
      limit: pageSize,
      page,
      pagination: true,
      depth: 0,
      select: {
        id: true,
        slug: true,
        title: true,
        htmlContent: true,
        content: true,
        featuredImage: true,
        featuredImageUrl: true,
        ogImageUrl: true,
        heroImage: true,
        layout: true,
      },
    })

    for (const doc of result.docs as DocRow[]) {
      if (opts.limit > 0 && yielded >= opts.limit) return
      yielded++
      yield doc
    }

    if (!result.hasNextPage || (opts.limit > 0 && yielded >= opts.limit)) return
    page++
  }
}

async function backfillDoc(
  payload: Payload,
  collection: CollectionSlug,
  doc: DocRow,
  opts: ReturnType<typeof parseArgs>,
) {
  const html =
    typeof doc.htmlContent === 'string' && doc.htmlContent.trim() ? doc.htmlContent.trim() : ''
  const imageUrl = imageUrlFromDoc(doc)
  const imageField = collection === 'posts' ? 'heroImage' : 'featuredImage'
  const currentImageId = collection === 'posts' ? doc.heroImage : doc.featuredImage

  const needsContent = html && (opts.force || needsLegacyHtmlConversion(doc.content, html))
  const needsImage = imageUrl && !currentImageId
  const needsLayoutCleanup = collection === 'pages' && isPlaceholderLayout(doc.layout)

  if (!needsContent && !needsImage && !needsLayoutCleanup) {
    return { updated: false as const, reason: 'already_complete' as const }
  }

  const data: Record<string, unknown> = {}

  if (needsContent) {
    data.content = await wpHtmlToLexical(html, payload.config, {
      featuredImageUrl: imageUrl,
      title: typeof doc.title === 'string' ? doc.title : null,
    })
    data.htmlContent = null
  }

  if (needsImage && imageUrl) {
    const mediaId = await ensureMedia(
      payload,
      imageUrl,
      String(doc.slug ?? doc.id),
      String(doc.title ?? doc.slug ?? 'Featured image'),
      opts.dryRun,
    )
    if (mediaId && mediaId > 0) {
      data[imageField] = mediaId
      if (!doc.featuredImageUrl) data.featuredImageUrl = imageUrl
    }
  }

  if (needsLayoutCleanup) {
    data.layout = []
  }

  if (!opts.dryRun && Object.keys(data).length > 0) {
    await payload.update({
      collection,
      id: doc.id,
      data,
      overrideAccess: true,
      context: { disableBackendSync: true, disableRevalidate: true, disableLegacyHydration: true },
    })
  }

  return {
    updated: true as const,
    content: Boolean(needsContent),
    image: Boolean(needsImage && data[imageField]),
    layoutCleared: Boolean(needsLayoutCleanup),
  }
}

async function backfillCollection(
  payload: Payload,
  collection: CollectionSlug,
  opts: ReturnType<typeof parseArgs>,
) {
  const report = {
    processed: 0,
    updated: 0,
    contentFilled: 0,
    imagesLinked: 0,
    layoutCleared: 0,
    skipped: 0,
    errors: [] as string[],
  }

  for await (const doc of iterateDocs(payload, collection, opts)) {
    report.processed++
    try {
      const result = await backfillDoc(payload, collection, doc, opts)
      if (!result.updated) {
        report.skipped++
        continue
      }
      report.updated++
      if (result.content) report.contentFilled++
      if (result.image) report.imagesLinked++
      if (result.layoutCleared) report.layoutCleared++

      if (report.updated % 25 === 0) {
        console.log(`  [${collection}] …${report.updated} updated`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      report.errors.push(`${doc.slug}: ${msg}`)
    }
  }

  return report
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  process.env.PAYLOAD_DATABASE_PUSH = 'false'

  const { default: config } = await import('@payload-config')
  const { getPayload } = await import('payload')
  const payload = await getPayload({ config })
  console.log('[backfill] Starting CMS visual backfill…', opts.dryRun ? '(dry run)' : '')

  const pagesReport = opts.postsOnly
    ? null
    : await backfillCollection(payload, 'pages', opts)
  const postsReport = opts.pagesOnly
    ? null
    : await backfillCollection(payload, 'posts', opts)

  const summary = { startedAt: new Date().toISOString(), opts, pages: pagesReport, posts: postsReport }

  await mkdir(REPORT_DIR, { recursive: true })
  const reportPath = path.join(REPORT_DIR, `cms-backfill-${Date.now()}.json`)
  await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf8')

  console.log('\n[backfill] Done')
  if (pagesReport) console.log('  Pages:', pagesReport)
  if (postsReport) console.log('  Posts:', postsReport)
  console.log('  Report:', reportPath)

  const errors = [...(pagesReport?.errors ?? []), ...(postsReport?.errors ?? [])]
  if (errors.length) process.exit(1)
}

main().catch((e) => {
  console.error('[backfill] Fatal:', e)
  process.exit(1)
})
