import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

export type BannerBlockFields = {
  blockType?: 'banner'
  blockName?: string | null
  style?: 'info' | 'warning' | 'error' | 'success' | null
  content?: DefaultTypedEditorState | null
}
