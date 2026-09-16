import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const useVercelBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Media file',
    plural: 'Media library (images)',
  },
  admin: {
    group: 'Website content',
    description:
      'Uploaded images. Run `npm run import:wp-media` to import featured images from the WordPress export.',
    useAsTitle: 'filename',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      //required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  hooks: {
    afterRead: [
      ({ doc }) => {
        if (doc && !doc.url && typeof doc.filename === 'string' && doc.filename) {
          doc.url = `/media/${doc.filename}`
        }
        return doc
      },
    ],
  },
  upload: {
    ...(useVercelBlob
      ? {}
      : { staticDir: path.resolve(dirname, '../../public/media') }),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}
