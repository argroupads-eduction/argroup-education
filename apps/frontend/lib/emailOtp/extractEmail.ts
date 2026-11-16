const EMAIL_FIELD_KEYS = ['email', 'e-mail', 'emailaddress', 'email_address', 'useremail'];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, '');
}

export function extractEmailFromFields(
  fields: Record<string, unknown> | { field: string; value: string }[] | undefined
): string | null {
  if (!fields) return null;

  if (Array.isArray(fields)) {
    for (const row of fields) {
      const key = normalizeKey(row.field || '');
      if (EMAIL_FIELD_KEYS.includes(key) && row.value?.trim()) {
        return row.value.trim();
      }
    }
    return null;
  }

  for (const [key, value] of Object.entries(fields)) {
    const nk = normalizeKey(key);
    if (EMAIL_FIELD_KEYS.includes(nk) && typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}
