import { NextResponse } from 'next/server';
import { getMbbsHeroFallbackForm } from '@/lib/mbbsHeroFormFallback';
import {
  loadMbbsHeroFormDefinitionServer,
  MBBS_HERO_FORM_DEFINITION_CACHE_CONTROL,
} from '@/lib/mbbsHeroFormDefinitionServer';

export const revalidate = 60;

export async function GET() {
  const result = await loadMbbsHeroFormDefinitionServer('india');

  if (result.ok) {
    return NextResponse.json(
      { docs: [result.doc] },
      { headers: { 'Cache-Control': MBBS_HERO_FORM_DEFINITION_CACHE_CONTROL } }
    );
  }

  return NextResponse.json(
    {
      docs: [getMbbsHeroFallbackForm('india')],
      _fallback: true,
      _cmsMessage: result.message,
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
