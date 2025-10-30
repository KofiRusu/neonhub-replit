import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import Snoowrap from "snoowrap";
import { RedditConnector } from "../services/RedditConnector.js";
import { retryManager } from "../execution/RetryManager.js";

jest.mock("snoowrap", () => {
  const SnoowrapMock = jest.fn();
  return { __esModule: true, default: SnoowrapMock };
});

const SnoowrapMock = Snoowrap as unknown as jest.Mock;

const submitSelfpostMock: jest.Mock = jest.fn();
const submitLinkMock: jest.Mock = jest.fn();
const replyMock: jest.Mock = jest.fn();
const fetchMock: jest.Mock = jest.fn();
const getSubredditMock: jest.Mock = jest.fn();
const getSubmissionMock: jest.Mock = jest.fn();
const getMeMock: jest.Mock = jest.fn();

const connector = new RedditConnector();

const auth = {
  apiKey: "client-id",
  apiSecret: "client-secret",
  metadata: {
    username: "neonhub-bot",
    password: "super-secret",
    userAgent: "NeonHubTests/1.0",
  },
};

let runSpy: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
  runSpy = jest.spyOn(retryManager, "run").mockImplementation(async fn => fn());
  submitSelfpostMock.mockReset();
  submitSelfpostMock.mockImplementation(async () => ({
    id: "post123",
    name: "t3_post123",
    url: "https://reddit.com/r/neonhub/post123",
    permalink: "/r/neonhub/post123",
    subreddit_name_prefixed: "r/neonhub",
  }));

  submitLinkMock.mockReset();
  submitLinkMock.mockImplementation(async () => ({
    id: "link123",
    name: "t3_link123",
    url: "https://neonhub.ai/blog",
    permalink: "/r/neonhub/link123",
    subreddit_name_prefixed: "r/neonhub",
  }));

  replyMock.mockReset();
  replyMock.mockImplementation(async () => ({
    id: "comment123",
    name: "t1_comment123",
    body: "Great insight!",
    permalink: "/r/neonhub/post123/comment/comment123",
  }));

  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => ({
    id: "t5_abc",
    display_name: "neonhub",
    title: "NeonHub Community",
    public_description: "Discuss automation strategies",
    subscribers: 4200,
    accounts_active_is_fuzzed: false,
    active_user_count: 256,
    over18: false,
  }));

  getMeMock.mockReset();
  getMeMock.mockImplementation(async () => ({ name: "neonhub-bot" }));

  getSubredditMock.mockReset().mockImplementation(() => ({
    submitSelfpost: submitSelfpostMock,
    submitLink: submitLinkMock,
    fetch: fetchMock,
  }));

  getSubmissionMock.mockReset().mockImplementation(() => ({
    reply: replyMock,
  }));

  SnoowrapMock.mockReset().mockImplementation(() => ({
    getSubreddit: getSubredditMock,
    getSubmission: getSubmissionMock,
    getMe: getMeMock,
  }));
});

afterEach(() => {
  runSpy.mockRestore();
});

describe("RedditConnector", () => {
  it("submits text posts to subreddit", async () => {
    const submitPost = connector.actions.find(action => action.id === "submitPost");
    if (!submitPost) throw new Error("submitPost action not found");

    const result = await submitPost.execute({
      auth,
      input: {
        subreddit: "neonhub",
        title: "Weekly Growth Standup",
        text: "Share your top experiments!",
      },
    });

    expect(SnoowrapMock).toHaveBeenCalledWith({
      userAgent: "NeonHubTests/1.0",
      clientId: "client-id",
      clientSecret: "client-secret",
      username: "neonhub-bot",
      password: "super-secret",
    });
    expect(getSubredditMock).toHaveBeenCalledWith("neonhub");
    expect(submitSelfpostMock).toHaveBeenCalledWith({
      title: "Weekly Growth Standup",
      text: "Share your top experiments!",
      flairId: undefined,
    });
    expect(result).toMatchObject({
      id: "post123",
      subreddit: "r/neonhub",
    });
  });

  it("submits link posts when URL provided", async () => {
    const submitPost = connector.actions.find(action => action.id === "submitPost");
    if (!submitPost) throw new Error("submitPost action not found");

    await submitPost.execute({
      auth,
      input: {
        subreddit: "neonhub",
        title: "Launch Announcement",
        url: "https://neonhub.ai/launch",
        flairId: "flair123",
      },
    });

    expect(submitLinkMock).toHaveBeenCalledWith({
      title: "Launch Announcement",
      url: "https://neonhub.ai/launch",
      flairId: "flair123",
    });
    expect(submitSelfpostMock).not.toHaveBeenCalled();
  });

  it("submits comments on submissions", async () => {
    const submitComment = connector.actions.find(action => action.id === "submitComment");
    if (!submitComment) throw new Error("submitComment action not found");

    const result = await submitComment.execute({
      auth,
      input: {
        submissionId: "post123",
        body: "Thanks for sharing!",
      },
    });

    expect(getSubmissionMock).toHaveBeenCalledWith("post123");
    expect(replyMock).toHaveBeenCalledWith("Thanks for sharing!");
    expect(result).toMatchObject({
      id: "comment123",
      body: "Great insight!",
    });
  });

  it("retrieves subreddit info", async () => {
    const getSubredditInfo = connector.actions.find(action => action.id === "getSubredditInfo");
    if (!getSubredditInfo) throw new Error("getSubredditInfo action not found");

    const result = await getSubredditInfo.execute({
      auth,
      input: {
        subreddit: "neonhub",
      },
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(result).toMatchObject({
      name: "neonhub",
      title: "NeonHub Community",
      subscribers: 4200,
      activeAccounts: 256,
    });
  });

  it("passes testConnection when credentials valid", async () => {
    await expect(connector.testConnection(auth)).resolves.toBe(true);
    expect(getMeMock).toHaveBeenCalled();
  });

  it("fails testConnection when client throws", async () => {
    getMeMock.mockImplementation(async () => {
      throw new Error("invalid");
    });
    await expect(connector.testConnection(auth)).resolves.toBe(false);
  });
});
