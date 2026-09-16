/**
 * Audit Payload CMS vs wp-export-bundle: counts, slugs, SEO fields.
 * Usage: npx tsx scripts/audit-cms-seo.mts
 */
import 'dotenv/config'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')
const BUNDLE_DIR = path.join(REPO_ROOT, 'apps/frontend/data/wp-export-bundle')
const HOME_SLUG = 'mbbs-admission-in-top-colleges'

type WpItem = {
  slug: string
  status: string
  metaTitle?: string | null
  metaDescription?: string | null
  focusKeyword?: string | null
  keywords?: string[]
  title: string
}

type CmsRow = {
  slug: string
  title: string | null
  meta_title: string | null
  meta_description: string | null
  focus_keyword: string | null
  seo_keywords: string | null
  html_content: string | null
  _status: string | null
}

function pgClient() {
  const raw = process.env.DATABASE_URL?.trim() ?? ''
  const isSupabase = raw.includes('supabase.com')
  const connectionString = isSupabase
    ? raw.replace(/([?&])sslmode=[^&]*/gi, '$1').replace(/[?&]$/, '').replace(/\?&/, '?')
    : raw
  return new pg.Client(
    isSupabase
      ? { connectionString, ssl: { rejectUnauthorized: false } }
      : { connectionString },
  )
}

function expectedFocus(item: WpItem): string | null {
  const kw = Array.isArray(item.keywords)
    ? item.keywords.map((k) => String(k).trim()).filter(Boolean)
    : []
  return (
    (typeof item.focusKeyword === 'string' && item.focusKeyword.trim()) || kw[0] || null
  )
}

function hasSeo(item: WpItem, row: CmsRow | undefined): {
  ok: boolean
  issues: string[]
} {
  if (!row) return { ok: false, issues: ['missing in CMS'] }
  const issues: string[] = []
  if (!row.slug?.trim()) issues.push('empty slug')
  if (!row.meta_title?.trim()) issues.push('missing meta title')
  if (!row.meta_description?.trim()) issues.push('missing meta description')
  const expFocus = expectedFocus(item)
  if (expFocus && !row.focus_keyword?.trim()) issues.push('missing focus keyword')
  if (!row.html_content?.trim()) issues.push('missing htmlContent')
  return { ok: issues.length === 0, issues }
}

async function loadBundle(type: 'posts' | 'pages'): Promise<WpItem[]> {
  const file = path.join(BUNDLE_DIR, type === 'posts' ? 'posts.json' : 'pages.json')
  const items = JSON.parse(await readFile(file, 'utf8')) as WpItem[]
  return items.filter((i) => i.status === 'publish' && i.slug !== HOME_SLUG)
}

async function loadCms(table: 'posts' | 'pages'): Promise<CmsRow[]> {
  const client = pgClient()
  await client.connect()
  try {
    const res = await client.query<CmsRow>(
      `SELECT slug, title, meta_title, meta_description, focus_keyword, seo_keywords, html_content, _status
       FROM cms.${table}
       WHERE _status = 'published' OR _status IS NULL`,
    )
    return res.rows
  } finally {
    await client.end().catch(() => undefined)
  }
}

function auditCollection(
  label: string,
  expected: WpItem[],
  rows: CmsRow[],
) {
  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  const missing: string[] = []
  const seoIssues: { slug: string; issues: string[] }[] = []

  for (const item of expected) {
    const row = bySlug.get(item.slug)
    if (!row) {
      missing.push(item.slug)
      continue
    }
    const check = hasSeo(item, row)
    if (!check.ok) seoIssues.push({ slug: item.slug, issues: check.issues })
  }

  const extra = rows
    .map((r) => r.slug)
    .filter((slug) => !expected.some((e) => e.slug === slug))

  return {
    label,
    expected: expected.length,
    inCms: rows.length,
    present: expected.length - missing.length,
    missing,
    seoIssues,
    extraInCms: extra,
  }
}

const postsExp = await loadBundle('posts')
const pagesExp = await loadBundle('pages')
const postsCms = await loadCms('posts')
const pagesCms = await loadCms('pages')

const posts = auditCollection('posts', postsExp, postsCms)
const pages = auditCollection('pages', pagesExp, pagesCms)

const report = {
  generatedAt: new Date().toISOString(),
  bundle: { posts: postsExp.length, pages: pagesExp.length },
  cms: { posts: postsCms.length, pages: pagesCms.length },
  posts,
  pages,
}

const outDir = path.join(BUNDLE_DIR, 'reports')
await mkdir(outDir, { recursive: true })
const outPath = path.join(outDir, `cms-seo-audit-${Date.now()}.json`)
await writeFile(outPath, JSON.stringify(report, null, 2), 'utf8')

console.log('\n=== CMS SEO Audit ===\n')
console.log(`Bundle (published): ${postsExp.length} posts, ${pagesExp.length} pages`)
console.log(`Payload CMS:        ${postsCms.length} posts, ${pagesCms.length} pages`)
console.log('')
console.log(
  `Posts: ${posts.present}/${posts.expected} present | missing: ${posts.missing.length} | SEO gaps: ${posts.seoIssues.length}`,
)
console.log(
  `Pages: ${pages.present}/${pages.expected} present | missing: ${pages.missing.length} | SEO gaps: ${pages.seoIssues.length}`,
)
if (posts.missing.length) {
  console.log('\nMissing posts (first 15):', posts.missing.slice(0, 15).join(', '))
}
if (pages.missing.length) {
  console.log('\nMissing pages (first 15):', pages.missing.slice(0, 15).join(', '))
}
console.log(`\nFull report: ${outPath}`)
