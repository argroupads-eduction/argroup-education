import type { Field } from 'payload'

/** SEO keywords shown in the SEO tab (not buried in sidebar). */
export const seoContentFields: Field[] = [
  {
    name: 'focusKeyword',
    type: 'text',
    label: 'Focus keyword',
    admin: {
      description: 'Primary SEO keyword for this page or post (e.g. MBBS in Nepal).',
    },
  },
  {
    name: 'seoKeywords',
    type: 'text',
    hasMany: true,
    label: 'Additional SEO keywords',
    admin: {
      description: 'Press Enter after each keyword. Used for search and internal tagging.',
    },
  },
]
