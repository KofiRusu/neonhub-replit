import { describe, it, expect, beforeEach, afterAll, jest } from "@jest/globals";
import { GoogleAdsConnector } from "../services/GoogleAdsConnector.js";
import { retryManager } from "../execution/RetryManager.js";

const connector = new GoogleAdsConnector();
const fetchSpy = jest.spyOn(global, "fetch");
const retrySpy = jest.spyOn(retryManager, "run");

const auth = {
  accessToken: "ya29.a0AfH6SMD",
  apiSecret: "developer-token",
  metadata: {
    customerId: "1234567890",
    loginCustomerId: "0987654321",
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

function mockGoogleAdsResponse(body: unknown) {
  fetchSpy.mockResolvedValue({
    ok: true,
    status: 200,
    async json() {
      return body;
    },
  } as Response);
}

describe("GoogleAdsConnector", () => {
  it("searches campaigns with GAQL query", async () => {
    const action = connector.actions.find(item => item.id === "searchCampaigns");
    if (!action) throw new Error("searchCampaigns action missing");

    mockGoogleAdsResponse({ results: [{ campaign: { id: "100", name: "Brand Search" } }] });

    const result = await action.execute({
      auth,
      input: {
        query: "SELECT campaign.id, campaign.name FROM campaign LIMIT 5",
      },
    }) as any;

    expect(result).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://googleads.googleapis.com/v15/customers/1234567890/googleAds:search");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Authorization: expect.stringContaining("Bearer"),
      "developer-token": "developer-token",
      "login-customer-id": "0987654321",
    });
  });

  it("creates campaign budgets", async () => {
    const action = connector.actions.find(item => item.id === "createCampaignBudget");
    if (!action) throw new Error("createCampaignBudget action missing");

    mockGoogleAdsResponse({ resourceName: "customers/1234567890/campaignBudgets/888" });

    const result = await action.execute({
      auth,
      input: {
        name: "Launch Budget",
        amountMicros: 200000000,
      },
    }) as any;

    expect(result.resourceName).toBe("customers/1234567890/campaignBudgets/888");
    const body = JSON.parse((fetchSpy.mock.calls[0][1]?.body ?? "{}") as string);
    expect(body.campaignBudget.amountMicros).toBe(200000000);
  });

  it("retrieves campaign metrics", async () => {
    const action = connector.actions.find(item => item.id === "getCampaignMetrics");
    if (!action) throw new Error("getCampaignMetrics action missing");

    mockGoogleAdsResponse({
      results: [
        {
          metrics: {
            impressions: "1200",
            clicks: "45",
            conversions: "5",
          },
        },
      ],
    });

    const result = await action.execute({
      auth,
      input: {
        campaignId: "999",
        dateRange: {
          startDate: "2024-01-01",
          endDate: "2024-01-31",
        },
      },
    }) as any;

    expect(result).toMatchObject({ impressions: "1200", clicks: "45" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
