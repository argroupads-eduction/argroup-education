import type { Field } from 'payload'

/** SEO keywords on the document root (matches Neon `focus_keyword` / `seo_keywords` columns). */
export const seoKeywordFields: Field[] = [
  {
    name: 'focusKeyword',
    type: 'text',
    label: 'Focus keyword',
    admin: {
      position: 'sidebar',
      description: 'Primary SEO keyword for this page or post (e.g. MBBS in Nepal).',
    },
  },
  {
    name: 'seoKeywords',
    type: 'textarea',
    label: 'Additional SEO keywords',
    admin: {
      position: 'sidebar',
      description: 'Comma-separated keywords for search and internal tagging.',
    },
  },
]

