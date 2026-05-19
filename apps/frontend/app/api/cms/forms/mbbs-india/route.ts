import { NextResponse } from 'next/server';
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
    { message: result.message, docs: [] },
    {
      status: result.status,
      headers: { 'Cache-Control': MBBS_HERO_FORM_DEFINITION_CACHE_CONTROL },
    }
  );
}
