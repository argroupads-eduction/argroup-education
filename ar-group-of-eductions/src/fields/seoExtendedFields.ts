import type { Field } from 'payload'

/** Yoast-style SEO fields synced to Neon (import + publish). */
export const seoExtendedFields: Field[] = [
  {
    name: 'canonicalUrl',
    type: 'text',
    label: 'Canonical URL',
    admin: { position: 'sidebar' },
  },
  {
    name: 'ogImageUrl',
    type: 'text',
    label: 'OG image URL (imported)',
    admin: { position: 'sidebar' },
  },
  {
    name: 'robotsMeta',
    type: 'text',
    label: 'Robots (e.g. index, follow)',
    admin: { position: 'sidebar' },
  },
  {
    name: 'schemaJson',
    type: 'json',
    label: 'Schema markup (JSON-LD)',
    admin: { position: 'sidebar' },
  },
]
