import { NextResponse } from 'next/server';
import {
  fetchYoutubeChannelVideos,
  YOUTUBE_FEED_REVALIDATE_SECONDS,
} from '@/lib/youtube/fetchChannelVideos';
import { withTtlCache } from '@/lib/serverTtlCache';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'youtube-channel-videos';
const CACHE_TTL_MS = YOUTUBE_FEED_REVALIDATE_SECONDS * 1000;

export async function GET() {
  const payload = await withTtlCache(CACHE_KEY, CACHE_TTL_MS, fetchYoutubeChannelVideos);

  if (!payload) {
    return NextResponse.json(
      {
        channelId: '',
        channelTitle: 'AR Group of Education',
        channelUrl: 'https://www.youtube.com/@argroupofeducation',
        subscriberCount: null,
        videoCount: null,
        videos: [],
        syncedAt: new Date().toISOString(),
        unavailable: true,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': `public, s-maxage=${YOUTUBE_FEED_REVALIDATE_SECONDS}, stale-while-revalidate=300`,
        },
      },
    );
  }

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': `public, s-maxage=${YOUTUBE_FEED_REVALIDATE_SECONDS}, stale-while-revalidate=300`,
    },
  });
}
