import type { Field } from 'payload'

/** Full WordPress / live-site HTML body — primary editor for imported pages & posts. */
export function htmlBodyField(label: string): Field {
  return {
    name: 'htmlContent',
    type: 'code',
    label,
    admin: {
      language: 'html',
      description:
        'Complete live-site body HTML. Edit headings, tables, FAQs, images, and all sections here. Changes publish to the marketing site when you save.',
    },
  }
}
