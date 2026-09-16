/**
 * Apply Google Doc "Blog Meta Changes" to Payload CMS + sync to marketing Neon.
 *
 * Usage:
 *   node scripts/apply-blog-meta-sheet.mjs           # dry-run
 *   node scripts/apply-blog-meta-sheet.mjs --apply   # write CMS + sync
 */
import dotenv from 'dotenv'
import pg from 'pg'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(dir, '..', '.env') })

const APPLY = process.argv.includes('--apply')
const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.FRONTEND_URL ||
  'https://www.argroupofeducation.com'
).replace(/\/$/, '')

const secret = (
  process.env.REVALIDATE_SECRET ||
  process.env.PAYLOAD_SYNC_SECRET ||
  ''
)
  .trim()
  .replace(/\r$/, '')

const BACKEND =
  (process.env.BACKEND_API_URL || 'http://localhost:3001').replace(/\/$/, '')

/** @type {Array<{
 *  oldSlug: string
 *  newSlug: string
 *  metaTitle: string
 *  metaDescription: string
 *  blogTitle?: string
 *  featuredPath: string | null
 * }>} */
const UPDATES = [
  {
    oldSlug: 'how-to-get-mbbs-with-a-low-neet-score-in-2026',
    newSlug: 'mbbs-with-low-neet-score-2026',
    metaTitle: 'MBBS with Low NEET Score 2026: Options & Admission Guide',
    metaDescription:
      'Looking for MBBS with low NEET score 2026? Explore private colleges, deemed universities, MBBS abroad & alternative courses to pursue your MBBS dream.',
    featuredPath: '/images/blog/how-to-get-mbbs-with-a-low-neet-score-in-2026.png',
  },
  {
    oldSlug: 'mbbs-admission-2026-without-donation',
    newSlug: 'mbbs-admission-without-donation-2026',
    metaTitle: 'MBBS Admission Without Donation 2026 – Full Guide',
    metaDescription:
      'MBBS admission without donation is 100% possible in 2026! Get the complete guide on NEET eligibility, fees, top colleges & merit-based counselling process.',
    featuredPath: '/images/blog/mbbs-admission-2026-without-donation.png',
  },
  {
    oldSlug: 'mbbs-drop-year-strategy-neet-2026',
    newSlug: 'mbbs-drop-year-strategy-neet-2026',
    metaTitle: 'MBBS Drop Year Strategy After NEET 2026: Smart Comeback Plan',
    metaDescription:
      'Confused about your MBBS drop year strategy after NEET 2026? Get a smart study plan, realistic targets, mock test tips & a focused comeback approach here.',
    featuredPath: '/images/blog/mbbs-drop-year-strategy-neet-2026.png',
  },
  {
    oldSlug: 'mbbs-course-duration-in-india-and-abroad-2026',
    newSlug: 'mbbs-course-duration-in-india-and-abroad-2026',
    metaTitle: 'MBBS Course Duration in India and Abroad – Full Comparison',
    metaDescription:
      'MBBS Course Duration in India and Abroad: Know total years, internship rules & study pattern. Compare countries & choose the right path for MBBS in 2026.',
    featuredPath: null,
  },
  {
    oldSlug: 'marks-are-required-in-neet-for-mbbs',
    newSlug: 'marks-required-in-neet-for-mbbs-2026',
    metaTitle: 'Marks Required in NEET for MBBS 2026 (Category Wise)',
    metaDescription:
      'Confused about marks required in NEET for MBBS? Check 2026 cutoff, safe scores, and college chances. Get clear insights to secure your seat.',
    featuredPath: '/images/blog/how-many-marks-are-required-in-neet-for-mbbs-v2.png',
  },
  {
    oldSlug: 'mbbs-with-300-marks-in-neet',
    newSlug: 'mbbs-with-300-marks-in-neet-2026',
    metaTitle: 'Can You Get MBBS with 300 Marks in NEET? 2026 Guide',
    metaDescription:
      'Worried about MBBS with 300 marks in NEET? Discover your real chances in government & private colleges, cutoffs, fees, and the best alternatives in 2026.',
    featuredPath: '/images/blog/mbbs-with-300-marks-in-neet-v2.png',
  },
  {
    oldSlug: '400-marks-in-neet-rank',
    newSlug: '400-marks-in-neet-2026',
    metaTitle: '400 Marks in NEET 2026: Colleges, Rank & Admission Guide',
    metaDescription:
      'Scored 400 marks in NEET 2026? Discover your expected rank, top MBBS colleges accepting this score, cutoffs, fees, and smart admission strategies.',
    blogTitle: '400 Marks in NEET 2026: Which MBBS Colleges Can You Get?',
    featuredPath: null,
  },
  {
    // Doc reused Blog 7 old slug by mistake; live curated map uses this slug.
    oldSlug: 'score-is-needed-in-neet',
    newSlug: 'score-needed-in-neet-2026',
    metaTitle: 'How Much Score is Needed in NEET 2026? Cutoff Guide',
    metaDescription:
      'How much score is needed in NEET 2026? Check expected cutoff, category-wise marks, and admission chances for top colleges in India.',
    featuredPath: '/images/blog/how-much-score-needed-neet-2026-full-cut-off-analysis.png',
  },
  {
    oldSlug: 'neet-paper-analysis',
    newSlug: 'neet-2026-paper-analysis',
    metaTitle: 'NEET 2026 Paper Analysis: Tough or Easy? Full Review',
    metaDescription:
      'Detailed NEET 2026 paper analysis with expert review, difficulty level, expected cutoff, and MBBS admission insights for Indian students.',
    blogTitle: 'NEET 2026 Paper Analysis – Difficulty Level, Subject Review & Exam Level',
    featuredPath: null,
  },
]

const raw = process.env.DATABASE_URL?.trim()?.replace(/^["']|["']$/g, '')
if (!raw) {
  console.error('missing DATABASE_URL')
  process.exit(1)
}
if (APPLY && !secret) {
  console.error('missing REVALIDATE_SECRET / PAYLOAD_SYNC_SECRET')
  process.exit(1)
}

const client = new pg.Client({
  connectionString: raw.replace(/[?&]sslmode=[^&]*/gi, ''),
  ssl: { rejectUnauthorized: true },
  statement_timeout: 30_000,
})
await client.connect()
await client.query("SET statement_timeout = '20s'")

async function findPost(oldSlug, newSlug) {
  const r = await client.query(
    `SELECT id, slug, title, _status, meta_title, meta_description, featured_image_url, html_content, published_at
     FROM cms.posts AS OF SYSTEM TIME '-1s'
     WHERE slug = $1 OR slug = $2
     ORDER BY CASE WHEN slug = $2 THEN 0 ELSE 1 END
     LIMIT 1`,
    [oldSlug, newSlug],
  )
  return r.rows[0] || null
}

async function syncToBackend(row, update, featuredAbsolute) {
  const body = {
    type: 'post',
    slug: update.newSlug,
    title: update.blogTitle || row.title || update.newSlug,
    content: row.html_content || row.title || '',
    featuredImage: featuredAbsolute || row.featured_image_url || null,
    ogImage: featuredAbsolute || row.featured_image_url || null,
    metaTitle: update.metaTitle,
    metaDescription: update.metaDescription,
    published: row._status === 'published',
    publishedAt: row.published_at,
    category: 'Blog',
    pullFromCms: false,
  }

  const url = `${BACKEND}/api/cms/payload-sync`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  })
  const text = await res.text()
  return { status: res.status, text: text.slice(0, 300) }
}

const results = []

for (const update of UPDATES) {
  const row = await findPost(update.oldSlug, update.newSlug)
  if (!row) {
    results.push({ ...update, ok: false, error: 'not found in CMS' })
    continue
  }

  const featuredAbsolute = update.featuredPath ? `${SITE}${update.featuredPath}` : null
  const nextTitle = update.blogTitle || row.title

  console.log(
    `\n[${row.id}] ${row.slug} → ${update.newSlug}` +
      (row.slug !== update.newSlug ? ' (slug change)' : ' (meta only)'),
  )
  console.log('  title:', nextTitle)
  console.log('  meta:', update.metaTitle)
  console.log('  image:', featuredAbsolute || row.featured_image_url || '(keep)')

  if (!APPLY) {
    results.push({ ...update, ok: true, dryRun: true, cmsId: row.id })
    continue
  }

  await client.query(
    `UPDATE cms.posts SET
       slug = $2,
       title = $3,
       meta_title = $4,
       meta_description = $5,
       featured_image_url = COALESCE($6, featured_image_url),
       hero_image_id = CASE WHEN $6::text IS NOT NULL THEN NULL ELSE hero_image_id END,
       updated_at = NOW()
     WHERE id = $1`,
    [
      row.id,
      update.newSlug,
      nextTitle,
      update.metaTitle,
      update.metaDescription,
      featuredAbsolute,
    ],
  )

  // If slug changed, soft-delete any leftover Neon row for old slug via unpublish sync
  if (update.oldSlug !== update.newSlug && row.slug === update.oldSlug) {
    try {
      await fetch(`${BACKEND}/api/cms/payload-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          type: 'post',
          slug: update.oldSlug,
          title: row.title,
          content: '',
          published: false,
        }),
        signal: AbortSignal.timeout(20_000),
      })
    } catch {
      /* ignore */
    }
  }

  const synced = await syncToBackend(
    { ...row, title: nextTitle, featured_image_url: featuredAbsolute || row.featured_image_url },
    update,
    featuredAbsolute,
  )
  results.push({ ...update, ok: synced.status < 400, cmsId: row.id, sync: synced })
  console.log('  sync:', synced.status, synced.text)
}

await client.end()

console.log('\n--- summary ---')
console.log(JSON.stringify(results, null, 2))
console.log(APPLY ? '\nApplied.' : '\nDry-run only. Re-run with --apply to write.')
