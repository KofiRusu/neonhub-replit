import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { TrendAgent } from "../../agents/TrendAgent.js";

describe("TrendAgent", () => {
  let openaiMock: any;
  let prismaMock: any;
  let agent: TrendAgent;

  beforeEach(() => {
    openaiMock = {
      chat: {
        completions: {
          create: jest.fn(async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    trends: [
                      {
                        keyword: "ai marketing automation",
                        searchVolume: 12000,
                        trendVelocity: 65,
                        region: "US",
                        relatedKeywords: ["ai campaigns", "automation workflows"],
                      },
                    ],
                  }),
                },
              },
            ],
          })),
        },
      },
    };

    prismaMock = {
      organizationMembership: {
        findFirst: jest.fn(async () => ({ organizationId: "org-1" })),
      },
      agentJob: {
        create: jest.fn(async () => ({ id: "subscription-1" })),
      },
    };

    agent = new TrendAgent({
      openai: openaiMock,
      prisma: prismaMock,
    } as any);
  });

  it("returns trending keywords from OpenAI response", async () => {
    const trends = await agent.discoverTrends({
      niche: "marketing technology",
    });

    expect(openaiMock.chat.completions.create).toHaveBeenCalled();
    expect(trends).toHaveLength(1);
    expect(trends[0].keyword).toBe("ai marketing automation");
  });

  it("creates trend subscription via agent job", async () => {
    const subscriptionId = await agent.subscribeToTrends({
      userId: "user-1",
      keywords: ["ai marketing"],
    });

    expect(subscriptionId).toBe("subscription-1");
    expect(prismaMock.agentJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agent: "trend-subscription",
          createdById: "user-1",
        }),
      }),
    );
  });
});

