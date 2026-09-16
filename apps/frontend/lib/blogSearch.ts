export function normalizeBlogSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function blogPostMatchesQuery(
  post: { title: string; slug: string; excerpt?: string; category?: string },
  query: string
): boolean {
  if (!query) return true;
  const haystack = normalizeBlogSearchText(
    [post.title, post.slug.replace(/-/g, ' '), post.slug, post.excerpt, post.category]
      .filter(Boolean)
      .join(' ')
  );
  const tokens = query.split(/\s+/).filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}
