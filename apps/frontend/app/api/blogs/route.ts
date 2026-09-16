import { NextRequest, NextResponse } from 'next/server';
import { listBlogPosts } from '@backend/handlers/blogs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10);
    const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '10', 10);
    const category = req.nextUrl.searchParams.get('category') ?? undefined;
    const result = await listBlogPosts(page, limit, category ?? undefined);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/blogs', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching blogs' },
      { status: 500 }
    );
  }
}
