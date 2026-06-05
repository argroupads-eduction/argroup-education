import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

/** Shared Lexical features for page/post body content (used in admin + HTML import). */
export const marketingContentLexicalFeatures = ({
  rootFeatures,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rootFeatures: any[]
}) => [
  ...rootFeatures,
  ParagraphFeature(),
  BoldFeature(),
  ItalicFeature(),
  UnderlineFeature(),
  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
  UnorderedListFeature(),
  OrderedListFeature(),
  LinkFeature({
    enabledCollections: ['pages', 'posts'],
  }),
  UploadFeature({
    enabledCollections: ['media'],
  }),
  EXPERIMENTAL_TableFeature(),
  HorizontalRuleFeature(),
  FixedToolbarFeature(),
  InlineToolbarFeature(),
]

export const marketingContentEditor = lexicalEditor({
  features: marketingContentLexicalFeatures,
})
