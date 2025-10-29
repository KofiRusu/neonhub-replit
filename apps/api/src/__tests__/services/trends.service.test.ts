import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { SocialApiClient } from "../../lib/socialApiClient";
import * as socialApiClient from "../../lib/socialApiClient";
import { brief, getTrendsByPlatform, searchTrends } from "../../services/trends.service";

jest.mock("../../lib/socialApiClient", () => {
  const actual = jest.requireActual("../../lib/socialApiClient") as typeof import("../../lib/socialApiClient");
  return {
    ...actual,
    socialApiClient: {
      aggregateTrends: jest.fn(),
      fetchTwitterTrends: jest.fn(),
      fetchRedditTrends: jest.fn(),
    },
  };
});

const mockTrends = [
  { keyword: "AI Agents", volume: 15000, sentiment: 0.7, platform: "twitter" as const, timestamp: new Date("2025-10-01T12:00:00Z") },
  { keyword: "Marketing Automation", volume: 8000, sentiment: 0.6, platform: "reddit" as const, timestamp: new Date("2025-10-01T11:00:00Z") },
]

const mockedClient = socialApiClient.socialApiClient as jest.Mocked<SocialApiClient>;

describe("trends.service", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedClient.aggregateTrends.mockResolvedValue(mockTrends);
    mockedClient.fetchTwitterTrends.mockResolvedValue(mockTrends.filter((t) => t.platform === "twitter"));
    mockedClient.fetchRedditTrends.mockResolvedValue(mockTrends.filter((t) => t.platform === "reddit"));
  });

  it("creates a trend brief with summary and recommendations", async () => {
    const result = await brief({ notes: "Focus on AI" });

    expect(result.timeframe).toBe("last 24 hours");
    expect(result.topTrends).toHaveLength(2);
    expect(result.recommendations[0].action).toContain("AI Agents");
    expect(result.notes).toBe("Focus on AI");
  });

  it("filters trends by platform", async () => {
    await brief({ platforms: ["twitter"] });
    expect(mockedClient.aggregateTrends).toHaveBeenCalled();
  });

  it("returns platform-specific trends", async () => {
    const twitterTrends = await getTrendsByPlatform("twitter", { limit: 10 });
    expect(twitterTrends.every((trend) => trend.platform === "twitter")).toBe(true);
  });

  it("searches aggregated trends", async () => {
    const results = await searchTrends("agent");
    expect(results).toHaveLength(1);
    expect(results[0].keyword).toBe("AI Agents");
  });
});
