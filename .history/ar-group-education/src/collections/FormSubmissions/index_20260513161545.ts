import type { CollectionConfig } from 'payload'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  admin: {
    defaultColumns: ['name', 'email', 'phone', 'program', 'createdAt'],
    useAsTitle: 'email',
  },
  access: {
    create: () => true,
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
    },
    {
      name: 'program',
      type: 'select',
      options: [
        { label: 'MBBS in India', value: 'mbbs-india' },
        { label: 'MBBS Abroad', value: 'mbbs-abroad' },
        { label: 'MD/MS', value: 'md-ms' },
      ],
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
