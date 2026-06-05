import type { Field } from 'payload'

/** Single menu entry — page pick (newest first) or custom URL. */
export function menuLinkFields(): Field[] {
  return [
    {
      name: 'label',
      type: 'text',
      required: true,
      label: 'Navigation label',
    },
    {
      name: 'linkType',
      type: 'radio',
      defaultValue: 'page',
      options: [
        { label: 'Link to Page', value: 'page' },
        { label: 'Custom URL', value: 'custom' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      label: 'Page',
      admin: {
        condition: (_, siblingData) => siblingData?.linkType !== 'custom',
        description: 'Pick a page — newest imports show at the top when sorted by date.',
      },
    },
    {
      name: 'url',
      type: 'text',
      label: 'Custom URL',
      admin: {
        condition: (_, siblingData) => siblingData?.linkType === 'custom',
        description: 'e.g. /mbbs-india/up or /about',
      },
    },
  ]
}

/** Level-3 links (colleges). */
const menuLevel3Fields: Field[] = [
  ...menuLinkFields(),
]

/** Level-2 (states / countries / MD-MS items). */
const menuLevel2Fields: Field[] = [
  ...menuLinkFields(),
  {
    name: 'collegeLinks',
    type: 'array',
    label: 'Sub-links (colleges / universities)',
    admin: {
      initCollapsed: true,
      components: {
        RowLabel: '@/Header/MenuRowLabel#MenuRowLabel',
      },
    },
    fields: menuLevel3Fields,
  },
]

/** Top-level menu (Home, MBBS India, …) — WordPress-style tree. */
export const mainMenuItemFields: Field[] = [
  ...menuLinkFields(),
  {
    name: 'megaMenu',
    type: 'select',
    label: 'Mega menu style (frontend)',
    defaultValue: 'none',
    options: [
      { label: 'None — simple link', value: 'none' },
      { label: 'MBBS India panel', value: 'mbbs-india' },
      { label: 'MBBS Abroad panel', value: 'mbbs-abroad' },
      { label: 'MD/MS panel', value: 'md-ms' },
    ],
  },
  {
    name: 'subItems',
    type: 'array',
    label: 'Sub-menu (e.g. MBBS in UP)',
    admin: {
      initCollapsed: true,
      components: {
        RowLabel: '@/Header/MenuRowLabel#MenuRowLabel',
      },
    },
    fields: menuLevel2Fields,
  },
]
