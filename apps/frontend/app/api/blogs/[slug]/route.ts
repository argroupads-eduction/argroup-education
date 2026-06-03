import { NextResponse } from 'next/server';
import { getBlogPostBySlug } from '@backend/handlers/blogs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);
    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Blog post not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('GET /api/blogs/:slug', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching blog' },
      { status: 500 }
    );
  }
}
