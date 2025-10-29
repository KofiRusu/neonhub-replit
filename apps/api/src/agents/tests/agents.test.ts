import { describe, it, expect } from "@jest/globals";
import type { OrchestratorRequest } from "../../services/orchestration/types.js";
import { adAgent } from "../AdAgent.js";
import { brandVoiceAgent } from "../BrandVoiceAgent.js";
import { emailAgent } from "../EmailAgent.js";
import { seoAgent } from "../SEOAgent.js";
import { socialAgent } from "../SocialAgent.js";
import { supportAgent } from "../SupportAgent.js";
import { insightAgent } from "../InsightAgent.js";

const context = { userId: "agent-test-user" } as const;

describe("Agent contracts", () => {
  it("AdAgent generates deterministic ad copy", async () => {
    const request: OrchestratorRequest = {
      agent: "AdAgent",
      intent: "generate-ad",
      payload: {
        product: "NeonHub",
        audience: "marketers",
        platform: "google"
      },
      context
    };

    const response = await adAgent.handle(request);
    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.data).toHaveProperty("headline");
    }
  });

  it("ContentAgent returns knowledge search results", async () => {
    const response = await brandVoiceAgent.handle({
      agent: "ContentAgent",
      intent: "knowledge-search",
      payload: { query: "brand" },
      context
    });
    expect(response.ok).toBe(true);
  });

  it("EmailAgent provides deterministic sequence in test mode", async () => {
    const response = await emailAgent.handle({
      agent: "EmailMarketingAgent",
      intent: "generate-sequence",
      payload: { topic: "Launch", numEmails: 2 },
      context
    });
    expect(response.ok).toBe(true);
    if (response.ok) {
      expect((response.data as any).sequence).toHaveLength(2);
    }
  });

  it("SEOAgent analyzes keyword intents deterministically", async () => {
    const response = await seoAgent.analyzeIntent({
      keywords: ["marketing automation strategy"],
    });
    expect(response.intents).toHaveLength(1);
    expect(response.intents[0].intent).toBeDefined();
    expect(response.summary.dominantIntent).toBeDefined();
  });

  it("SocialAgent synthesizes posts when in test mode", async () => {
    const response = await socialAgent.handle({
      agent: "SocialAgent",
      intent: "generate-post",
      payload: { content: "Testing", platform: "twitter" },
      context
    });
    expect(response.ok).toBe(true);
  });

  it("SupportAgent processes feedback", async () => {
    const response = await supportAgent.handle({
      agent: "SupportAgent",
      intent: "support",
      payload: { subject: "Help", message: "Need assistance" },
      context
    });
    expect(response.ok).toBe(true);
  });

  it("InsightAgent analyzes metrics deterministically", async () => {
    const response = await insightAgent.handle({
      agent: "AnalyticsAgent",
      intent: "analyze-data",
      payload: {
        metrics: [
          { name: "Clicks", value: 120, previousValue: 100 },
          { name: "Conversions", value: 10, previousValue: 8 }
        ],
        timeframe: "7d"
      },
      context
    });
    expect(response.ok).toBe(true);
  });
});
