import type { GlobalConfig } from 'payload'

import { simpleLinkListField } from '@/fields/siteLinkFields'
import { link } from '@/fields/link'
import { createGlobalBackendSyncHook } from '@/globals/hooks/createGlobalBackendSyncHook'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer — company & program links',
  admin: {
    group: 'Site menu & footer',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Company links',
          fields: [simpleLinkListField('companyLinks', 'Company links', 12)],
        },
        {
          label: 'Program links',
          fields: [simpleLinkListField('programLinks', 'Program links', 12)],
        },
        {
          label: 'Extra nav',
          description: 'Additional footer links (merged with hardcoded + CMS pages).',
          fields: [
            {
              name: 'navItems',
              type: 'array',
              fields: [
                link({
                  appearances: false,
                }),
              ],
              maxRows: 12,
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: '@/Footer/RowLabel#RowLabel',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateFooter, createGlobalBackendSyncHook('footer')],
  },
}
