import type { GlobalConfig } from 'payload'

import { mainMenuItemFields } from '@/fields/menuLinkFields'
import { createGlobalBackendSyncHook } from '@/globals/hooks/createGlobalBackendSyncHook'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Main menu',
  admin: {
    group: 'Site menu & footer',
    description:
      'Build the site header menu. Use “Quick pick” for recent pages, then drag items in the tree below.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'ui',
      name: 'menuHelp',
      admin: {
        components: {
          Field: '@/Header/MenuHelp#MenuHelp',
        },
      },
    },
    {
      name: 'quickPickPages',
      type: 'relationship',
      relationTo: 'pages',
      hasMany: true,
      label: 'Quick add — recent pages',
      admin: {
        description:
          'Select pages you just imported (newest first). Copy title/URL into menu items below, or link via “Link to Page”.',
        sortOptions: '-createdAt',
      },
    },
    {
      name: 'menuItems',
      type: 'array',
      label: 'Menu structure',
      fields: mainMenuItemFields,
      admin: {
        initCollapsed: false,
        components: {
          RowLabel: '@/Header/MenuRowLabel#MenuRowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader, createGlobalBackendSyncHook('header')],
  },
}
