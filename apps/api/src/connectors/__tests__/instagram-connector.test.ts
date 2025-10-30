import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { InstagramConnector } from "../services/InstagramConnector.js";
import { retryManager } from "../execution/RetryManager.js";

const connector = new InstagramConnector();

const fetchSpy = jest.spyOn(global, "fetch");
const runSpy = jest.spyOn(retryManager, "run");

const creds = {
  accessToken: "test-access-token",
  pageId: "1234567890",
};

const auth = {
  accessToken: creds.accessToken,
  metadata: { pageId: creds.pageId },
};

beforeEach(() => {
  fetchSpy.mockReset();
  runSpy.mockImplementation(async fn => fn());
});

afterAll(() => {
  fetchSpy.mockRestore();
  runSpy.mockRestore();
});

function mockFetchSequence(responses: Array<{ status?: number; body?: unknown }>) {
  fetchSpy.mockImplementation(async () => {
    const next = responses.shift() ?? {};
    const status = next.status ?? 200;
    const payload = next.body ?? {};
    return {
      ok: status >= 200 && status < 300,
      status,
      async json() {
        return payload;
      },
    } as Response;
  });
}

describe("InstagramConnector", () => {
  it("publishes posts via media upload and publish flow", async () => {
    const publishPost = connector.actions.find(action => action.id === "publishPost");
    if (!publishPost) throw new Error("publishPost action not found");

    mockFetchSequence([
      { body: { id: "IGC_123" } },
      { body: { id: "IGM_456" } },
    ]);

    const result = await publishPost.execute({
      auth,
      input: { imageUrl: "https://cdn.neonhub.ai/post.jpg", caption: "Launch day" },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const firstCall = fetchSpy.mock.calls[0];
    const postUrl = new URL(firstCall[0] as string);
    expect(postUrl.pathname).toBe(`/v18.0/${creds.pageId}/media`);
    expect(postUrl.searchParams.get("access_token")).toBe("test-access-token");
    expect(firstCall[1]?.method).toBe("POST");
    const body = JSON.parse(firstCall[1]?.body as string);
    expect(body.image_url).toBe("https://cdn.neonhub.ai/post.jpg");

    expect(result).toMatchObject({ creationId: "IGC_123", mediaId: "IGM_456" });
  });

  it("publishes stories using media type stories", async () => {
    const publishStory = connector.actions.find(action => action.id === "publishStory");
    if (!publishStory) throw new Error("publishStory action not found");

    mockFetchSequence([
      { body: { id: "IGS_789" } },
      { body: { id: "IGM_321" } },
    ]);

    const result = await publishStory.execute({
      auth,
      input: { mediaUrl: "https://cdn.neonhub.ai/story.mp4" },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const firstCall = fetchSpy.mock.calls[0];
    const body = JSON.parse(firstCall[1]?.body as string);
    expect(body.media_type).toBe("STORIES");
    expect(result).toMatchObject({ creationId: "IGS_789", mediaId: "IGM_321" });
  });

  it("retrieves insights for a media item", async () => {
    const getInsights = connector.actions.find(action => action.id === "getInsights");
    if (!getInsights) throw new Error("getInsights action not found");

    mockFetchSequence([
      {
        body: {
          data: [
            { name: "impressions", values: [{ value: 1024 }] },
            { name: "reach", values: [{ value: 850 }] },
            { name: "saved", values: [{ value: 25 }] },
          ],
        },
      },
    ]);

    const result = await getInsights.execute({
      auth,
      input: { postId: "IGM_456" },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const insightsUrl = new URL(fetchSpy.mock.calls[0][0] as string);
    expect(insightsUrl.pathname).toBe("/v18.0/IGM_456/insights");
    expect(insightsUrl.searchParams.get("access_token")).toBe("test-access-token");
    expect(result).toMatchObject({
      impressions: 1024,
      reach: 850,
      saved: 25,
    });
  });
});
