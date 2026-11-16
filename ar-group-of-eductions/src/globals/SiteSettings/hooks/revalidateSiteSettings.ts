import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

function safeRevalidateTag(tag: string) {
  try {
    revalidateTag(tag, 'max')
  } catch {
    /* no-op outside Next.js */
  }
}

export const revalidateSiteSettings: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating site-settings')
    safeRevalidateTag('global_site-settings')
  }
  return doc
}
