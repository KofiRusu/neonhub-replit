import { describe, it, expect, beforeEach, afterAll, jest } from "@jest/globals";
import { LinkedInConnector } from "../services/LinkedInConnector.js";
import { retryManager } from "../execution/RetryManager.js";

const connector = new LinkedInConnector();
const fetchSpy = jest.spyOn(global, "fetch");
const retrySpy = jest.spyOn(retryManager, "run");

const auth = {
  accessToken: "AQX_test_token",
  metadata: {
    organizationUrn: "urn:li:organization:12345",
    adAccountUrn: "urn:li:sponsoredAccount:67890",
  },
};

beforeEach(() => {
  fetchSpy.mockReset();
  retrySpy.mockImplementation(async fn => fn());
});

afterAll(() => {
  fetchSpy.mockRestore();
  retrySpy.mockRestore();
});

function mockLinkedInResponse(body: unknown, status = 200) {
  fetchSpy.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
  } as Response);
}

describe("LinkedInConnector", () => {
  it("publishes organization shares", async () => {
    const action = connector.actions.find(item => item.id === "shareUpdate");
    if (!action) throw new Error("shareUpdate action missing");

    mockLinkedInResponse({ id: "urn:li:ugcPost:123" });

    const result = (await action.execute({
      auth,
      input: {
        text: "Launching NeonHub automation suite!",
        media: [
          {
            url: "https://neonhub.ai/blog/launch",
            title: "Launch Blog",
          },
        ],
      },
    })) as any;

    expect(result).toEqual({ postUrn: "urn:li:ugcPost:123" });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.linkedin.com/v2/ugcPosts");
    const body = JSON.parse((init?.body ?? "{}") as string);
    expect(body.author).toBe("urn:li:organization:12345");
  });

  it("creates ad campaigns", async () => {
    const action = connector.actions.find(item => item.id === "createAdCampaign");
    if (!action) throw new Error("createAdCampaign action missing");

    mockLinkedInResponse({ id: "urn:li:sponsoredCampaign:500" });

    const result = (await action.execute({
      auth,
      input: {
        name: "Lead Gen Q4",
        dailyBudget: 150,
        startDate: "2024-01-01",
      },
    })) as any;

    expect(result).toEqual({ campaignUrn: "urn:li:sponsoredCampaign:500" });
    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.headers).toMatchObject({
      "X-Restli-Protocol-Version": "2.0.0",
    });
    const body = JSON.parse((init?.body ?? "{}") as string);
    expect(body.account).toBe("urn:li:sponsoredAccount:67890");
  });

  it("retrieves share statistics", async () => {
    const action = connector.actions.find(item => item.id === "getShareStatistics");
    if (!action) throw new Error("getShareStatistics action missing");

    mockLinkedInResponse({
      elements: [{ totalShareStatistics: { shareCount: 10 } }],
    });

    const result = (await action.execute({
      auth,
      input: {},
    })) as any;

    expect(result).toHaveLength(1);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain("organizationalEntityShareStatistics");
    expect(url).toContain("organizationalEntity=urn%3Ali%3Aorganization%3A12345");
  });
});
