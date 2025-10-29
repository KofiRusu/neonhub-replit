import { describe, it, expect } from "@jest/globals";
import { adAgent } from "../AdAgent.js";
import { emailAgent } from "../EmailAgent.js";
import { insightAgent } from "../InsightAgent.js";
import { seoAgent } from "../SEOAgent.js";
import { SocialAgent } from "../SocialAgent.js";

describe("Agent exports", () => {
  it("provides sample campaign data from AdAgent", () => {
    const sample = adAgent.getSampleCampaign();
    expect(sample).toHaveProperty("headline");
    expect(sample).toHaveProperty("targetAudience");
  });

  it("exposes email sequence generator", () => {
    expect(typeof emailAgent.generateSequence).toBe("function");
  });

  it("returns sample insights without network access", () => {
    const insights = insightAgent.getSampleInsights();
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0]).toHaveProperty("type");
  });

  it("analyzes keyword intent deterministically", async () => {
    const result = await seoAgent.analyzeIntent({
      keywords: ["marketing automation strategy"],
    });
    expect(result.intents.length).toBeGreaterThan(0);
  });

  it("instantiates SocialAgent without throwing", () => {
    const agent = new SocialAgent();
    expect(agent).toBeInstanceOf(SocialAgent);
  });
});
