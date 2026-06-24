/**
 * Convert legacy `htmlContent` → visual Lexical `content` for all pages & posts.
 *
 * Usage (from ar-group-of-eductions):
 *   npx tsx scripts/convert-html-to-lexical.mts
 *   npx tsx scripts/convert-html-to-lexical.mts --dry-run --limit=5
 *   npx tsx scripts/convert-html-to-lexical.mts --pages-only
 *   npx tsx scripts/convert-html-to-lexical.mts --posts-only --force
 */

import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import config from '@payload-config'

import { needsLegacyHtmlConversion } from '../src/utilities/lexicalContent.js'
import { wpHtmlToLexical } from '../src/utilities/wpHtmlToLexical.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPORT_DIR = path.resolve(__dirname, '../../apps/frontend/data/wp-export-bundle/reports')

type CollectionSlug = 'pages' | 'posts'

function parseArgs(argv: string[]) {
  const limitMatch = argv.find((a) => a.startsWith('--limit='))
  const offsetMatch = argv.find((a) => a.startsWith('--offset='))
  return {
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    pagesOnly: argv.includes('--pages-only'),
    postsOnly: argv.includes('--posts-only'),
    limit: limitMatch ? Math.max(1, parseInt(limitMatch.split('=')[1] ?? '0', 10)) : Infinity,
    offset: offsetMatch ? Math.max(0, parseInt(offsetMatch.split('=')[1] ?? '0', 10)) : 0,
  }
}

async function convertCollection(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: CollectionSlug,
  opts: ReturnType<typeof parseArgs>,
) {
  const report = { converted: 0, skipped: 0, errors: [] as string[] }

  const result = await payload.find({
    collection,
    limit: opts.limit === Infinity ? 5000 : opts.limit,
    page: Math.floor(opts.offset / (opts.limit === Infinity ? 5000 : opts.limit)) + 1,
    pagination: true,
    depth: 0,
    where: {
      htmlContent: { exists: true },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      htmlContent: true,
      content: true,
      featuredImageUrl: true,
    },
  })

  const docs = result.docs.slice(
    opts.offset % (opts.limit === Infinity ? 5000 : opts.limit),
    opts.limit === Infinity ? undefined : opts.limit,
  )

  console.log(`[convert] ${collection}: processing ${docs.length} docs…`)

  for (const doc of docs) {
    const html =
      typeof doc.htmlContent === 'string' && doc.htmlContent.trim() ? doc.htmlContent.trim() : ''
    if (!html) {
      report.skipped++
      continue
    }

    if (!opts.force && !needsLegacyHtmlConversion(doc.content, html)) {
      report.skipped++
      continue
    }

    try {
      const lexical = await wpHtmlToLexical(html, payload.config, {
        featuredImageUrl:
          typeof doc.featuredImageUrl === 'string' ? doc.featuredImageUrl : null,
        title: typeof doc.title === 'string' ? doc.title : null,
      })

      if (!opts.dryRun) {
        await payload.update({
          collection,
          id: doc.id,
          data: { content: lexical, htmlContent: null },
          overrideAccess: true,
          context: { disableBackendSync: true, disableRevalidate: true, disableLegacyHydration: true },
        })
      }

      report.converted++
      if (report.converted % 25 === 0) {
        console.log(`  …${report.converted} converted`)
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

  const payload = await getPayload({ config })
  const startedAt = new Date().toISOString()

  const pagesReport = opts.postsOnly
    ? null
    : await convertCollection(payload, 'pages', opts)
  const postsReport = opts.pagesOnly
    ? null
    : await convertCollection(payload, 'posts', opts)

  const summary = {
    startedAt,
    dryRun: opts.dryRun,
    force: opts.force,
    pages: pagesReport,
    posts: postsReport,
  }

  await mkdir(REPORT_DIR, { recursive: true })
  const reportPath = path.join(REPORT_DIR, `lexical-convert-${Date.now()}.json`)
  await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf8')

  console.log('\n[convert] Done', opts.dryRun ? '(dry run)' : '')
  if (pagesReport) console.log('  Pages:', pagesReport)
  if (postsReport) console.log('  Posts:', postsReport)
  console.log('  Report:', reportPath)

  const errors = [...(pagesReport?.errors ?? []), ...(postsReport?.errors ?? [])]
  if (errors.length) process.exit(1)
}

main().catch((e) => {
  console.error('[convert] Fatal:', e)
  process.exit(1)
})
