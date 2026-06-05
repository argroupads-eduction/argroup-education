import type { Field } from 'payload'

/** Simple label + href rows for footer/header link lists. */
export const simpleLinkListField = (name: string, label: string, maxRows = 12): Field => ({
  name,
  type: 'array',
  label,
  maxRows,
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'href', type: 'text', required: true },
  ],
  admin: { initCollapsed: true },
})

export const socialLinkFields: Field[] = [
  {
    name: 'socialLinks',
    type: 'array',
    label: 'Social links',
    maxRows: 8,
    fields: [
      {
        name: 'platform',
        type: 'select',
        required: true,
        options: [
          { label: 'Facebook', value: 'facebook' },
          { label: 'Instagram', value: 'instagram' },
          { label: 'YouTube', value: 'youtube' },
          { label: 'LinkedIn', value: 'linkedin' },
          { label: 'Twitter / X', value: 'twitter' },
          { label: 'WhatsApp', value: 'whatsapp' },
        ],
      },
      { name: 'url', type: 'text', required: true },
    ],
    admin: { initCollapsed: true },
  },
]

export const contactFields: Field[] = [
  {
    type: 'row',
    fields: [
      { name: 'phone', type: 'text', label: 'Phone display' },
      { name: 'phoneTel', type: 'text', label: 'Phone tel: link' },
    ],
  },
  { name: 'email', type: 'email', label: 'Email' },
  { name: 'whatsapp', type: 'text', label: 'WhatsApp URL' },
  { name: 'address', type: 'textarea', label: 'Address (single line)' },
  { name: 'hours', type: 'text', label: 'Business hours' },
]
