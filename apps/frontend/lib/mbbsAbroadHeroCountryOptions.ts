/**
 * Countries shown in the MBBS Abroad hero enquiry form (State/Country dropdown).
 * Order matches counselling list; value === label for Payload submissions.
 */
export const MBBS_ABROAD_HERO_COUNTRY_OPTIONS: { label: string; value: string }[] = [
  { label: 'Russia', value: 'Russia' },
  { label: 'Nepal', value: 'Nepal'},
  { label: 'Uzbekistan', value: 'Uzbekistan' },
  { label: 'Kazakhstan', value: 'Kazakhstan' },
  { label: 'Georgia', value: 'Georgia' },
]

/** Lead popup — India + abroad destinations */
export const LEAD_CAPTURE_TARGET_OPTIONS: { label: string; value: string }[] = [
  { label: 'India (MBBS in India)', value: 'India' },
  ...MBBS_ABROAD_HERO_COUNTRY_OPTIONS,
]
