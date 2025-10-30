import { describe, it, expect, beforeEach, jest, afterAll } from "@jest/globals";
import axios from "axios";
import { FacebookConnector } from "../services/FacebookConnector.js";
import { retryManager } from "../execution/RetryManager.js";

jest.mock("axios");

const axiosMock = axios as jest.MockedFunction<typeof axios>;
const connector = new FacebookConnector();

const auth = {
  accessToken: "test-access-token",
  metadata: {
    pageId: "1234567890",
    adAccountId: "act_987654321",
  },
};

const runSpy = jest.spyOn(retryManager, "run");

beforeEach(() => {
  axiosMock.mockReset();
  runSpy.mockImplementation(async fn => fn());
});

afterAll(() => {
  runSpy.mockRestore();
});

describe("FacebookConnector", () => {
  it("creates page posts", async () => {
    const action = connector.actions.find(a => a.id === "createPost");
    if (!action) throw new Error("createPost not found");

    axiosMock.mockResolvedValueOnce(Promise.resolve({ data: { id: "1234567890_13579" } }));

    const result = await action.execute({
      auth,
      input: { message: "Hello Facebook", link: "https://neonhub.ai/hello" },
    });

    expect(axiosMock).toHaveBeenCalledTimes(1);
    const config = axiosMock.mock.calls[0]?.[0] as any;
    expect(config.url).toBe("https://graph.facebook.com/v18.0/1234567890/feed");
    expect(config.method).toBe("POST");
    expect(config.data).toMatchObject({
      message: "Hello Facebook",
      link: "https://neonhub.ai/hello",
      access_token: "test-access-token",
    });
    expect(result).toEqual({ postId: "1234567890_13579" });
  });

  it("creates ads for campaigns", async () => {
    const action = connector.actions.find(a => a.id === "createAd");
    if (!action) throw new Error("createAd not found");

    axiosMock.mockResolvedValueOnce(Promise.resolve({ data: { id: "2385000000001" } }));

    const result = await action.execute({
      auth,
      input: {
        campaignId: "cmp_42",
        creativeId: "cr_101",
        name: "Retargeting Ad",
        status: "ACTIVE",
      },
    });

    expect(axiosMock).toHaveBeenCalledTimes(1);
    const config = axiosMock.mock.calls[0]?.[0] as any;
    expect(config.url).toBe("https://graph.facebook.com/v18.0/act_987654321/ads");
    expect(config.data).toMatchObject({
      campaign_id: "cmp_42",
      creative: { creative_id: "cr_101" },
      status: "ACTIVE",
      access_token: "test-access-token",
    });
    expect(result).toEqual({ adId: "2385000000001" });
  });

  it("returns page insights", async () => {
    const action = connector.actions.find(a => a.id === "getPageInsights");
    if (!action) throw new Error("getPageInsights not found");

    axiosMock.mockResolvedValueOnce(
      Promise.resolve({
        data: {
          data: [
            { name: "page_impressions", values: [{ value: 12045 }] },
            { name: "page_engaged_users", values: [{ value: 854 }] },
          ],
        },
      })
    );

    const result = await action.execute({
      auth,
      input: { metric: "page_impressions,page_engaged_users", period: "day" },
    });

    expect(axiosMock).toHaveBeenCalledTimes(1);
    const config = axiosMock.mock.calls[0]?.[0] as any;
    expect(config.url).toBe("https://graph.facebook.com/v18.0/1234567890/insights");
    expect(config.params).toMatchObject({
      metric: "page_impressions,page_engaged_users",
      period: "day",
      access_token: "test-access-token",
    });
    expect(result).toEqual({
      page_impressions: 12045,
      page_engaged_users: 854,
    });
  });
});
