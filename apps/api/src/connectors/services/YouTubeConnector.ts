import { google } from "googleapis";
import fs from "node:fs";
import { PassThrough } from "node:stream";
import { z } from "zod";
import { Connector } from "../base/Connector.js";
import type { ConnectorAuthContext } from "../base/types.js";
import { retryManager } from "../execution/RetryManager.js";

const youtubeCredentialsSchema = z.object({
  accessToken: z.string().min(1, "Google access token is required"),
  refreshToken: z.string().min(1, "Google refresh token is required"),
  clientId: z.string().min(1, "Google client ID is required"),
  clientSecret: z.string().min(1, "Google client secret is required"),
  channelId: z.string().min(1, "YouTube channel ID is required"),
});

const uploadVideoSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  videoFile: z.string().min(1, "Video file path is required"),
  privacyStatus: z.enum(["public", "private", "unlisted"]).default("private"),
});

const updateVideoSchema = z.object({
  videoId: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
});

const statsSchema = z.object({
  videoId: z.string().min(1),
});

type YouTubeCredentials = z.infer<typeof youtubeCredentialsSchema>;

function resolveCredentials(auth: ConnectorAuthContext): YouTubeCredentials {
  const metadata = auth.metadata ?? {};
  const parsed = youtubeCredentialsSchema.parse({
    accessToken: auth.accessToken ?? metadata.accessToken,
    refreshToken: metadata.refreshToken ?? auth.refreshToken,
    clientId: metadata.clientId,
    clientSecret: metadata.clientSecret,
    channelId: metadata.channelId,
  });

  return parsed;
}

function createYouTubeClient(creds: YouTubeCredentials) {
  const oauth2Client = new google.auth.OAuth2({
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
  });
  oauth2Client.setCredentials({
    access_token: creds.accessToken,
    refresh_token: creds.refreshToken,
  });
  return google.youtube({ version: "v3", auth: oauth2Client });
}

async function uploadVideo(creds: YouTubeCredentials, params: z.infer<typeof uploadVideoSchema>) {
  const youtube = createYouTubeClient(creds);

  const fileStream = fs.createReadStream(params.videoFile);
  const passthrough = new PassThrough();
  fileStream.pipe(passthrough);

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: params.title,
        description: params.description,
        channelId: creds.channelId,
      },
      status: {
        privacyStatus: params.privacyStatus,
      },
    },
    media: {
      body: passthrough,
    },
  });

  return response.data;
}

async function updateVideo(creds: YouTubeCredentials, params: z.infer<typeof updateVideoSchema>) {
  const youtube = createYouTubeClient(creds);
  const response = await youtube.videos.update({
    part: ["snippet"],
    requestBody: {
      id: params.videoId,
      snippet: {
        title: params.title,
        description: params.description,
        tags: params.tags,
        categoryId: params.categoryId,
      },
    },
  });

  return response.data;
}

async function getVideoStatistics(creds: YouTubeCredentials, videoId: string) {
  const youtube = createYouTubeClient(creds);
  const response = await youtube.videos.list({
    id: [videoId],
    part: ["statistics"],
  });

  const item = response.data.items?.[0];
  if (!item?.statistics) {
    return {};
  }
  return {
    views: Number(item.statistics.viewCount ?? 0),
    likes: Number(item.statistics.likeCount ?? 0),
    comments: Number(item.statistics.commentCount ?? 0),
  };
}

export class YouTubeConnector extends Connector {
  constructor() {
    super({
      name: "youtube",
      displayName: "YouTube",
      description: "Upload videos and manage metadata via the YouTube Data API.",
      category: "social",
      iconUrl: "https://www.youtube.com/s/desktop/6f3e1dba/img/favicon_32x32.png",
      websiteUrl: "https://www.youtube.com",
      authType: "oauth2",
      authConfig: {
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: [
          "https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube",
          "https://www.googleapis.com/auth/youtube.readonly",
        ],
      },
    });
  }

  private getCredentials(auth: ConnectorAuthContext) {
    return resolveCredentials(auth);
  }

  actions = [
    {
      id: "uploadVideo",
      name: "Upload Video",
      description: "Upload a new video to YouTube using resumable upload.",
      inputSchema: uploadVideoSchema,
      execute: async ({ auth, input }) => {
        const creds = this.getCredentials(auth);
        const payload = uploadVideoSchema.parse(input);

        const video = await retryManager.run(() => uploadVideo(creds, payload));
        return {
          videoId: video.id,
          etag: video.etag,
        };
      },
    },
    {
      id: "updateVideo",
      name: "Update Video Metadata",
      description: "Update details for an existing YouTube video.",
      inputSchema: updateVideoSchema,
      execute: async ({ auth, input }) => {
        const creds = this.getCredentials(auth);
        const payload = updateVideoSchema.parse(input);
        const result = await retryManager.run(() => updateVideo(creds, payload));
        return result;
      },
    },
    {
      id: "getVideoStats",
      name: "Get Video Stats",
      description: "Retrieve statistics for a YouTube video.",
      inputSchema: statsSchema,
      execute: async ({ auth, input }) => {
        const creds = this.getCredentials(auth);
        const payload = statsSchema.parse(input);
        const stats = await retryManager.run(() => getVideoStatistics(creds, payload.videoId));
        return stats;
      },
    },
  ];

  triggers = [];

  async testConnection(auth: ConnectorAuthContext): Promise<boolean> {
    try {
      const creds = this.getCredentials(auth);
      await retryManager.run(() => getVideoStatistics(creds, "dQw4w9WgXcQ"));
      return true;
    } catch {
      return false;
    }
  }
}
