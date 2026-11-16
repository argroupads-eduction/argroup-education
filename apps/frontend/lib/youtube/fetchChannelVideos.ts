import type { YoutubeChannelPayload, YoutubeVideo } from './types';

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
const DEFAULT_HANDLE = 'argroupofeducation';
const MAX_VIDEOS = 16;

/** Client + server refresh interval (seconds). Override via YOUTUBE_FEED_REFRESH_SECONDS in Amplify. */
export const YOUTUBE_FEED_REVALIDATE_SECONDS = Math.max(
  30,
  Number(process.env.YOUTUBE_FEED_REFRESH_SECONDS) || 60
);

type ChannelResponse = {
  items?: Array<{
    id: string;
    snippet?: { title?: string };
    statistics?: { subscriberCount?: string; videoCount?: string };
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
  }>;
};

type PlaylistItemsResponse = {
  items?: Array<{
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: {
        maxres?: { url?: string };
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
      resourceId?: { videoId?: string };
    };
    contentDetails?: { videoId?: string };
  }>;
};

function formatCount(value: string | undefined): string | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

async function youtubeGet<T>(path: string, params: Record<string, string>, apiKey: string): Promise<T | null> {
  const url = new URL(`${YOUTUBE_API}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('key', apiKey);

  const res = await fetch(url.toString(), {
    next: { revalidate: YOUTUBE_FEED_REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    if (process.env.NODE_ENV === 'development') {
      const body = await res.text().catch(() => '');
      console.warn(`[youtube] ${path} failed (${res.status}):`, body.slice(0, 200));
    }
    return null;
  }

  return (await res.json()) as T;
}

type ChannelItem = NonNullable<ChannelResponse['items']>[number];

async function resolveChannel(
  apiKey: string,
  handle: string,
  channelIdOverride?: string
): Promise<ChannelItem | null> {
  if (channelIdOverride) {
    const byId = await youtubeGet<ChannelResponse>('channels', {
      part: 'snippet,statistics,contentDetails',
      id: channelIdOverride,
    }, apiKey);
    return byId?.items?.[0] ?? null;
  }

  const byHandle = await youtubeGet<ChannelResponse>('channels', {
    part: 'snippet,statistics,contentDetails',
    forHandle: handle.replace(/^@/, ''),
  }, apiKey);

  if (byHandle?.items?.[0]) return byHandle.items[0];

  const search = await youtubeGet<{ items?: Array<{ snippet?: { channelId?: string } }> }>(
    'search',
    {
      part: 'snippet',
      q: handle.replace(/^@/, ''),
      type: 'channel',
      maxResults: '1',
    },
    apiKey
  );

  const foundId = search?.items?.[0]?.snippet?.channelId;
  if (!foundId) return null;

  const bySearchId = await youtubeGet<ChannelResponse>('channels', {
    part: 'snippet,statistics,contentDetails',
    id: foundId,
  }, apiKey);

  return bySearchId?.items?.[0] ?? null;
}

function mapPlaylistItem(item: NonNullable<PlaylistItemsResponse['items']>[number]): YoutubeVideo | null {
  const videoId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
  if (!videoId) return null;

  const thumbs = item.snippet?.thumbnails;
  const thumbnailUrl =
    thumbs?.maxres?.url ??
    thumbs?.high?.url ??
    thumbs?.medium?.url ??
    thumbs?.default?.url ??
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return {
    id: videoId,
    title: item.snippet?.title?.trim() || 'AR Group of Education',
    description: item.snippet?.description?.trim() || '',
    publishedAt: item.snippet?.publishedAt ?? new Date().toISOString(),
    thumbnailUrl,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

/** Latest channel uploads (newest first) via YouTube Data API v3. */
export async function fetchYoutubeChannelVideos(): Promise<YoutubeChannelPayload | null> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) return null;

  const handle = process.env.YOUTUBE_CHANNEL_HANDLE?.trim() || DEFAULT_HANDLE;
  const channelIdOverride = process.env.YOUTUBE_CHANNEL_ID?.trim();

  const channel = await resolveChannel(apiKey, handle, channelIdOverride);
  if (!channel) return null;

  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return null;

  const playlist = await youtubeGet<PlaylistItemsResponse>(
    'playlistItems',
    {
      part: 'snippet,contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: String(MAX_VIDEOS),
    },
    apiKey
  );

  const videos =
    playlist?.items
      ?.map(mapPlaylistItem)
      .filter((v): v is YoutubeVideo => Boolean(v))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()) ?? [];

  if (!videos.length) return null;

  const channelId = channel.id;
  const channelTitle = channel.snippet?.title?.trim() || 'AR Group of Education';

  return {
    channelId,
    channelTitle,
    channelUrl: `https://www.youtube.com/channel/${channelId}`,
    subscriberCount: formatCount(channel.statistics?.subscriberCount),
    videoCount: formatCount(channel.statistics?.videoCount),
    videos,
    syncedAt: new Date().toISOString(),
  };
}
