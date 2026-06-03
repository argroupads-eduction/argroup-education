import { NextResponse } from 'next/server';
import { getContentBySlug } from '@backend/handlers/content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const result = await getContentBySlug(slug);
    if ('error' in result) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('GET /api/content/:slug', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching content' },
      { status: 500 }
    );
  }
}
