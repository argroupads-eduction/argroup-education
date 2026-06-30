import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Archive } from '../../blocks/ArchiveBlock/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { Content } from '../../blocks/Content/config'
import { FormBlock } from '../../blocks/Form/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { marketingContentEditor } from '@/fields/contentLexicalEditor'
import { htmlBodyField } from '@/fields/htmlBodyField'
import { seoKeywordFields } from '@/fields/seoContentFields'
import { hero } from '@/heros/config'
import { slugField } from 'payload'
import { seoExtendedFields } from '@/fields/seoExtendedFields'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'
import { syncPageDeleteToBackend, syncPageToBackend } from './hooks/syncPageToBackend'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
  defaultPopulate: {
    title: true,
    slug: true,
  },
  defaultSort: '-publishedAt',
  admin: {
    group: 'Website content',
    defaultColumns: ['title', 'slug', 'publishedAt', '_status'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'pages',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [hero],
          label: 'Hero',
        },
        {
          fields: [
            {
              name: 'featuredImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Featured image',
              admin: {
                description:
                  'Main page image (hero). Shown on the live site and in search previews. Upload or pick from Media library.',
              },
            },
            htmlBodyField('Full page body (HTML)'),
            {
              name: 'content',
              type: 'richText',
              editor: marketingContentEditor,
              label: 'Visual editor (optional)',
              required: false,
              admin: {
                description:
                  'Optional WYSIWYG editor for short sections. For imported WordPress pages, edit the HTML field above — it controls the live site.',
              },
            },
            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock, Archive, FormBlock],
              required: false,
              admin: {
                initCollapsed: true,
                description:
                  'Legacy layout blocks from import (usually a short excerpt). Ignore for full pages — use the HTML field above.',
              },
            },
            {
              name: 'featuredImageUrl',
              type: 'text',
              label: 'Featured image URL (imported)',
              admin: {
                hidden: true,
              },
            },
          ],
          label: 'Content',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'sitePlacement',
      type: 'group',
      label: 'Website placement',
      admin: {
        position: 'sidebar',
        description: 'Choose where this page appears in the live site navigation.',
      },
      fields: [
        {
          name: 'showInNavigation',
          type: 'checkbox',
          label: 'Show in site menu',
          defaultValue: false,
        },
        {
          name: 'navSection',
          type: 'select',
          label: 'Menu section',
          defaultValue: 'none',
          options: [
            { label: 'Standalone (URL only — not in menu)', value: 'none' },
            { label: 'Top navbar — main link', value: 'main' },
            { label: 'MBBS India mega menu', value: 'mbbs_india' },
            { label: 'MBBS Abroad mega menu', value: 'mbbs_abroad' },
            { label: 'MD/MS mega menu', value: 'md_ms' },
            { label: 'Footer links', value: 'footer' },
          ],
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.showInNavigation),
          },
        },
        {
          name: 'navParent',
          type: 'text',
          label: 'Under (state / country)',
          admin: {
            description:
              'For India/Abroad mega menus — use state/country name (Uttar Pradesh), id (up), or path (mbbs-india/up). Page link appears in that group’s college list.',
            condition: (_, siblingData) =>
              Boolean(siblingData?.showInNavigation) &&
              ['mbbs_india', 'mbbs_abroad'].includes(String(siblingData?.navSection ?? '')),
          },
        },
        {
          name: 'navLabel',
          type: 'text',
          label: 'Menu label (short)',
          admin: {
            description: 'Short name in the menu. Leave empty to use page title.',
            condition: (_, siblingData) => Boolean(siblingData?.showInNavigation),
          },
        },
        {
          name: 'navSortOrder',
          type: 'number',
          label: 'Sort order',
          defaultValue: 0,
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.showInNavigation),
          },
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Published date (from WordPress export)',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Original publish date from WP export. List is sorted by this (newest first).',
      },
    },
    ...seoKeywordFields,
    ...seoExtendedFields,
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage, syncPageToBackend],
    beforeChange: [
      populatePublishedAt,
      ({ data }) => {
        if (typeof data?.slug === 'string') {
          data.slug = data.slug
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
        }
        return data
      },
    ],
    afterDelete: [revalidateDelete, syncPageDeleteToBackend],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 2000,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
