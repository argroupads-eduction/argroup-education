import { NextResponse } from 'next/server';
import { fetchYoutubeChannelVideos } from '@/lib/youtube/fetchChannelVideos';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const payload = await fetchYoutubeChannelVideos();

  if (!payload) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[youtube] Feed unavailable — set YOUTUBE_API_KEY and enable YouTube Data API v3 in Google Cloud.'
      );
    }
    return NextResponse.json(
      {
        error: 'unavailable',
        message: 'Our YouTube feed is temporarily unavailable. Please visit our channel directly.',
      },
      { status: 503 }
    );
  }

  // Never cache at CDN/browser — client polls every ~60s; each hit fetches fresh from YouTube API.
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
