import { describe, it, expect, beforeEach, afterAll, jest } from "@jest/globals";
import { TikTokConnector } from "../services/TikTokConnector.js";
import { retryManager } from "../execution/RetryManager.js";

const connector = new TikTokConnector();
const fetchSpy = jest.spyOn(global, "fetch");
const retrySpy = jest.spyOn(retryManager, "run");

const auth = {
  accessToken: "test-access-token",
  metadata: {
    advertiserId: "1234567890",
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

function mockTikTokResponse(data: unknown) {
  fetchSpy.mockResolvedValue({
    ok: true,
    status: 200,
    async json() {
      return {
        code: 0,
        message: "OK",
        data,
      };
    },
  } as Response);
}

describe("TikTokConnector", () => {
  it("creates campaigns via marketing API", async () => {
    const action = connector.actions.find(item => item.id === "createCampaign");
    if (!action) throw new Error("createCampaign action missing");

    mockTikTokResponse({ campaign_id: "cmp_100" });

    const result = await action.execute({
      auth,
      input: {
        campaignName: "Launch Awareness",
        objectiveType: "TRAFFIC",
        budgetMode: "BUDGET_MODE_DAY",
        budget: 200,
      },
    });

    expect(result).toEqual({ campaignId: "cmp_100" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [requestUrl, init] = fetchSpy.mock.calls[0];
    expect(requestUrl).toBe("https://business-api.tiktok.com/open_api/v1.3/campaign/create/");
    expect(init?.method).toBe("POST");
    expect(JSON.parse((init?.body ?? "{}") as string)).toMatchObject({
      advertiser_id: "1234567890",
      campaign_name: "Launch Awareness",
    });
  });

  it("creates ad groups under campaigns", async () => {
    const action = connector.actions.find(item => item.id === "createAdGroup");
    if (!action) throw new Error("createAdGroup action missing");

    mockTikTokResponse({ adgroup_id: "adgrp_200" });

    const result = await action.execute({
      auth,
      input: {
        campaignId: "cmp_100",
        adGroupName: "Prospecting",
        placementType: "PLACEMENT_AUTOMATIC",
        optimizationGoal: "OPTIMIZATION_GOAL_CLICKS",
        billingEvent: "BILLINGEVENT_CLICK",
        bid: 2.75,
      },
    });

    expect(result).toEqual({ adGroupId: "adgrp_200" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchSpy.mock.calls[0][1]?.body ?? "{}") as string);
    expect(body.campaign_id).toBe("cmp_100");
    expect(body.bid).toBe(2.75);
  });

  it("fetches performance reports", async () => {
    const action = connector.actions.find(item => item.id === "getPerformanceReport");
    if (!action) throw new Error("getPerformanceReport action missing");

    mockTikTokResponse({
      list: [
        { campaign_name: "Launch Awareness", spend: 120, impressions: 1200, clicks: 45 },
      ],
    });

    const result = await action.execute({
      auth,
      input: {
        startDate: "2024-01-01",
        endDate: "2024-01-07",
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ campaign_name: "Launch Awareness", spend: 120 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

