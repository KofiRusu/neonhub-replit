import { describe, it, expect, beforeEach, jest, afterAll } from "@jest/globals";
import { PassThrough } from "node:stream";
import { google } from "googleapis";
import { YouTubeConnector } from "../services/YouTubeConnector.js";
import { retryManager } from "../execution/RetryManager.js";

jest.mock("googleapis", () => {
  const insertMock = jest.fn();
  const updateMock = jest.fn();
  const listMock = jest.fn();

  const youtubeMock = {
    videos: {
      insert: insertMock,
      update: updateMock,
      list: listMock,
    },
  } as unknown;

  const authMock = {
    OAuth2: jest.fn().mockImplementation(() => ({
      setCredentials: jest.fn(),
    })),
  };

  const googleMock = {
    auth: authMock,
    youtube: jest.fn().mockImplementation(() => youtubeMock),
  };

  return { google: googleMock, __esModule: true };
});

jest.mock("node:fs", () => ({
  createReadStream: jest.fn(() => new PassThrough()),
}));

const connector = new YouTubeConnector();
const runSpy = jest.spyOn(retryManager, "run");
const auth = {
  accessToken: "ya29.test",
  metadata: {
    refreshToken: "refresh-token",
    clientId: "client-id",
    clientSecret: "client-secret",
    channelId: "channel-id",
  },
};

beforeEach(() => {
  (google.youtube as jest.Mock).mockClear();
  runSpy.mockImplementation(async fn => fn());
});

afterAll(() => {
  runSpy.mockRestore();
});

describe("YouTubeConnector", () => {
  it("uploads videos", async () => {
    const action = connector.actions.find(a => a.id === "uploadVideo");
    if (!action) throw new Error("uploadVideo not found");

    const insertMock = jest.fn().mockImplementation(async () => ({ data: { id: "yt_upload_123", etag: "etag" } } as any));
    (google.youtube as jest.Mock).mockReturnValueOnce({
      videos: {
        insert: insertMock,
      },
    } as any);

    const result = await action.execute({
      auth,
      input: {
        title: "Launch Day",
        description: "Highlights",
        videoFile: "./fixtures/video.mp4",
        privacyStatus: "public",
      },
    });

    expect(result).toEqual({ videoId: "yt_upload_123", etag: "etag" });
    expect(insertMock).toHaveBeenCalled();
  });

  it("updates videos", async () => {
    const action = connector.actions.find(a => a.id === "updateVideo");
    if (!action) throw new Error("updateVideo not found");

    const updateMock = jest.fn().mockImplementation(async () => ({ data: { id: "yt_video_456" } } as any));
    (google.youtube as jest.Mock).mockReturnValueOnce({
      videos: {
        update: updateMock,
      },
    } as any);

    const result = await action.execute({
      auth,
      input: {
        videoId: "yt_video_456",
        title: "New Title",
      },
    });

    expect(result).toEqual({ id: "yt_video_456" });
    expect(updateMock).toHaveBeenCalled();
  });

  it("retrieves video stats", async () => {
    const action = connector.actions.find(a => a.id === "getVideoStats");
    if (!action) throw new Error("getVideoStats not found");

    const listMock = jest.fn().mockImplementation(async () => ({
      data: {
        items: [
          {
            statistics: {
              viewCount: "1024",
              likeCount: "512",
              commentCount: "12",
            },
          },
        ],
      },
    } as any));
    (google.youtube as jest.Mock).mockReturnValueOnce({
      videos: {
        list: listMock,
      },
    } as any);

    const result = await action.execute({
      auth,
      input: { videoId: "yt_video_789" },
    });

    expect(result).toEqual({ views: 1024, likes: 512, comments: 12 });
    expect(listMock).toHaveBeenCalled();
  });
});
