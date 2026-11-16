/** Shared program / counselling interest options for site forms. */
export const COUNSELLING_PROGRAM_SELECT_OPTIONS = [
  { label: 'MBBS India', value: 'mbbs-india' },
  { label: 'MBBS Abroad', value: 'mbbs-abroad' },
  { label: 'MD/MS', value: 'md-ms' },
  { label: 'BAMS', value: 'bams' },
] as const;

export const COUNSELLING_PROGRAM_VALUES = COUNSELLING_PROGRAM_SELECT_OPTIONS.map((o) => o.value);

export type CounsellingProgramValue = (typeof COUNSELLING_PROGRAM_SELECT_OPTIONS)[number]['value'];

export const EXTRA_PROGRAM_FORM_OPTIONS = [
  { label: 'MD/MS', value: 'MD/MS' },
  { label: 'BAMS', value: 'BAMS' },
] as const;

/** Combined India+Abroad style options removed from all site forms. */
const REMOVED_COMBINED_PROGRAM_RE =
  /india\s*\+\s*abroad|mbbs\s*india\s*\+\s*abroad|both\s*(india|abroad)|india\s*(and|&)\s*abroad/i;

const PROGRAM_FIELD_RE = /course|program|interest|counselling|special/i;

/** Merge MD/MS + BAMS into Payload select fields that list MBBS programmes. */
export function enrichHeroFormProgramSelects<
  T extends { fields?: { blockType: string; name?: string; label?: string | null; options?: { label: string; value: string }[] | null }[] | null },
>(doc: T): T {
  if (!doc.fields?.length) return doc;

  return {
    ...doc,
    fields: doc.fields.map((field) => {
      if (field.blockType !== 'select' || !field.options?.length) return field;

      const key = `${field.name || ''} ${field.label || ''}`.toLowerCase();
      const isProgramField =
        PROGRAM_FIELD_RE.test(key) ||
        field.options.some((o) => /mbbs|md\s*\/?\s*ms|bams/i.test(o.label));

      if (!isProgramField) return field;

      const withoutCombined = field.options.filter(
        (o) => !REMOVED_COMBINED_PROGRAM_RE.test(o.label) && !REMOVED_COMBINED_PROGRAM_RE.test(o.value)
      );

      const existing = new Set(withoutCombined.map((o) => o.value.trim().toLowerCase()));
      const merged = [...withoutCombined];

      for (const opt of EXTRA_PROGRAM_FORM_OPTIONS) {
        if (!existing.has(opt.value.toLowerCase())) {
          merged.push({ ...opt });
          existing.add(opt.value.toLowerCase());
        }
      }

      return { ...field, options: merged };
    }),
  };
}
