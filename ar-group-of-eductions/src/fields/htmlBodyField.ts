import type { Field } from 'payload'

/** Legacy WordPress HTML — hidden; visual editor is used instead. */
export function htmlBodyField(label: string): Field {
  return {
    name: 'htmlContent',
    type: 'code',
    label,
    admin: {
      hidden: true,
      language: 'html',
    },
  }
}
