import type { GlobalConfig } from 'payload'

import { contactFields, socialLinkFields } from '@/fields/siteLinkFields'
import { revalidateSiteSettings } from './hooks/revalidateSiteSettings'
import { syncSiteSettingsToBackend } from './hooks/syncSiteSettingsToBackend'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings — phone, email, social',
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
          label: 'Contact',
          fields: contactFields,
        },
        {
          label: 'Social',
          fields: socialLinkFields,
        },
        {
          label: 'SEO defaults',
          fields: [
            {
              name: 'defaultMetaTitle',
              type: 'text',
              label: 'Default meta title',
            },
            {
              name: 'defaultMetaDescription',
              type: 'textarea',
              label: 'Default meta description',
            },
            {
              name: 'defaultOgImageUrl',
              type: 'text',
              label: 'Default OG image URL',
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateSiteSettings, syncSiteSettingsToBackend],
  },
}
