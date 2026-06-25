/** Payload slug → live marketing site slug (must stay in sync with frontend BLOG_SLUG_CANONICAL). */
const POST_SLUG_ALIASES: Record<string, string> = {
  'top-medical-colleges-india': 'top-medical-colleges-in-india',
  'neet-re-exam-2026-vs-original-exam': 'neet-re-exam-2026-vs-original-exam-which-is-tougher',
}

export function marketingPostSlug(slug: string | null | undefined): string {
  const trimmed = typeof slug === 'string' ? slug.trim() : ''
  if (!trimmed) return ''
  return POST_SLUG_ALIASES[trimmed] ?? trimmed
}
