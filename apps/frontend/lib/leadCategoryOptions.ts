/** Shared reservation / category options for all website lead forms. */
export const LEAD_CATEGORY_OPTIONS = [
  { value: 'General', label: 'General' },
  { value: 'EWS', label: 'EWS' },
  { value: 'OBC', label: 'OBC' },
  { value: 'SC', label: 'SC' },
  { value: 'ST', label: 'ST' },
] as const;

export type LeadCategoryValue = (typeof LEAD_CATEGORY_OPTIONS)[number]['value'];
