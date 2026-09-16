import type { Payload } from 'payload'

type EnsurePageSpec = {
  slug: string
  title: string
  metaTitle?: string
  metaDescription?: string
}

const DEFAULT_PAGES: EnsurePageSpec[] = [
  {
    slug: 'neet-rank-predictor',
    title: 'NEET Rank Predictor 2026',
    metaTitle: 'NEET Rank Predictor 2026 | Check Expected Rank & College Chances',
    metaDescription:
      'NEET rank predictor by AR Group — get expected AIR, percentile, and matched MBBS India / Abroad colleges.',
  },
]

export async function ensureMarketingPages(payload: Payload) {
  try {
    const now = new Date()
    for (const spec of DEFAULT_PAGES) {
      const existing = await payload.find({
        collection: 'pages',
        where: { slug: { equals: spec.slug } },
        limit: 1,
        depth: 0,
      })
      if (existing?.docs?.[0]) continue

      await payload.create({
        collection: 'pages',
        depth: 0,
        draft: false,
        data: {
          title: spec.title,
          slug: spec.slug,
          publishedAt: now.toISOString(),
          hero: {
            type: 'none',
          },
          meta: {
            title: spec.metaTitle ?? spec.title,
            description: spec.metaDescription ?? '',
          },
          sitePlacement: {
            showInNavigation: false,
            navSection: 'none',
            navSortOrder: 0,
          },
        },
      })
    }
  } catch (e) {
    // Never block boot in dev/prod if sync fails
    payload.logger.warn({ err: e }, '[ensureMarketingPages] failed')
  }
}

