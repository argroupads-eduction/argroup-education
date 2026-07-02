export function getEmailFromHeroFormValues(
  values: Record<string, string>,
  fields: { name: string; blockType?: string | null }[]
): string {
  const emailField = fields.find(
    (f) =>
      f.blockType === 'email' ||
      f.name?.toLowerCase() === 'email' ||
      f.name?.toLowerCase().includes('email')
  );
  if (emailField) return String(values[emailField.name] ?? '').trim();
  return String(values.email ?? '').trim();
}
