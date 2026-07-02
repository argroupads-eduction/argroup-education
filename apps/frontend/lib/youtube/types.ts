export type YoutubeVideo = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  watchUrl: string;
};

export type YoutubeChannelPayload = {
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  subscriberCount: string | null;
  videoCount: string | null;
  videos: YoutubeVideo[];
  syncedAt: string;
};
