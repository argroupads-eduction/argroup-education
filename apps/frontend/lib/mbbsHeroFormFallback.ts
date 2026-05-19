import type { HeroMbbsFormDoc } from '@/lib/mbbsHeroFormDefinitionsCache';

/** Sentinel id — not a real Payload form; triggers offline submit path. */
export const HERO_MBBS_FALLBACK_FORM_ID = 0;

export function isHeroMbbsFallbackForm(doc: HeroMbbsFormDoc | null | undefined): boolean {
  return doc?.id === HERO_MBBS_FALLBACK_FORM_ID;
}

export function getMbbsHeroFallbackForm(kind: 'india' | 'abroad'): HeroMbbsFormDoc {
  if (kind === 'india') {
    return {
      id: HERO_MBBS_FALLBACK_FORM_ID,
      title: 'MBBS INDIA',
      submitButtonLabel: 'Submit',
      fields: [
        {
          blockType: 'text',
          name: 'name',
          label: 'Full name',
          required: true,
          placeholder: 'Your name',
        },
        {
          blockType: 'text',
          name: 'phone',
          label: 'Phone',
          required: true,
          placeholder: '10-digit mobile',
        },
        {
          blockType: 'email',
          name: 'email',
          label: 'Email',
          required: true,
          placeholder: 'you@example.com',
        },
        {
          blockType: 'state',
          name: 'state',
          label: 'State',
          required: true,
        },
      ],
    };
  }

  return {
    id: HERO_MBBS_FALLBACK_FORM_ID,
    title: 'MBBS ABROAD',
    submitButtonLabel: 'Submit',
    fields: [
      {
        blockType: 'text',
        name: 'name',
        label: 'Full name',
        required: true,
        placeholder: 'Your name',
      },
      {
        blockType: 'text',
        name: 'phone',
        label: 'Phone',
        required: true,
        placeholder: '10-digit mobile',
      },
      {
        blockType: 'email',
        name: 'email',
        label: 'Email',
        required: true,
        placeholder: 'you@example.com',
      },
      {
        blockType: 'country',
        name: 'country',
        label: 'Preferred country',
        required: true,
      },
    ],
  };
}
