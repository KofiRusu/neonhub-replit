import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Keyword, PrismaClient } from "@prisma/client";
import { SEOAgent } from "../../agents/SEOAgent.js";

const BASE_DATE = new Date("2025-01-01T00:00:00.000Z");

const personaKeywordFixtures: Keyword[] = [
  {
    id: 1,
    term: "marketing automation software",
    intent: "commercial",
    priority: 82,
    personaId: 101,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
  },
  {
    id: 2,
    term: "marketing automation workflow",
    intent: "informational",
    priority: 74,
    personaId: 101,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
  },
  {
    id: 3,
    term: "customer onboarding automation",
    intent: "transactional",
    priority: 68,
    personaId: 101,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
  },
] as Keyword[];

describe("SEOAgent foundation", () => {
  const fixedNow = () => new Date("2025-02-01T12:00:00.000Z");

  let prismaMock: PrismaClient;
  let prismaFindManyMock: jest.Mock;
  let jobManagerMock: {
    createJob: jest.Mock;
    startJob: jest.Mock;
    completeJob: jest.Mock;
    failJob: jest.Mock;
  };
  let agent: SEOAgent;

  beforeEach(() => {
    prismaFindManyMock = jest.fn(async () => personaKeywordFixtures);

    prismaMock = {
      keyword: {
        findMany: prismaFindManyMock,
      },
    } as unknown as PrismaClient;

    jobManagerMock = {
      createJob: jest.fn(async () => "job-seo-123"),
      startJob: jest.fn(async () => undefined),
      completeJob: jest.fn(async () => undefined),
      failJob: jest.fn(async () => undefined),
    };

    agent = new SEOAgent({
      prisma: prismaMock,
      jobManager: jobManagerMock as any,
      now: fixedNow,
    });
  });

  it("clusters keyword opportunities around dominant topics", async () => {
    const result = await agent.discoverKeywords({
      seeds: ["marketing automation"],
      personaId: "101",
      createdById: "user-123",
    });

    expect(jobManagerMock.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        agent: "seo",
      }),
    );
    expect(jobManagerMock.startJob).toHaveBeenCalledWith("job-seo-123");
    expect(result.summary.totalClusters).toBeGreaterThan(0);
    expect(result.summary.totalKeywords).toBeGreaterThan(0);
    expect(result.summary.personaId).toBe(101);
    expect(result.clusters[0].keywords[0]).toHaveProperty("opportunityScore");
  });

  it("honors persona dataset overrides during intent analysis", async () => {
    const result = await agent.analyzeIntent({
      keywords: [
        "marketing automation software",
        "customer onboarding automation",
      ],
      personaId: 101,
    });

    const matched = result.intents.find(
      (item) => item.keyword === "marketing automation software",
    );

    expect(matched?.intent).toBe("commercial");
    expect(matched?.confidence).toBeGreaterThan(0.8);
    expect(result.summary.dominantIntent).toBeDefined();
    expect(result.summary.analyzedAt).toBe(fixedNow().toISOString());
  });

  it("produces structured difficulty scoring with recommendations", async () => {
    const result = await agent.scoreDifficulty({
      keyword: "marketing automation platform",
      competitorDomains: ["example.com", "contender.dev"],
      backlinkCount: 140,
      domainAuthority: 55,
    });

    expect(result.difficulty).toBeGreaterThanOrEqual(0);
    expect(result.components.competition).toBeGreaterThan(0);
    expect(result.components.backlinkProfile).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.context.competitorDomains).toHaveLength(2);
  });

  it("ranks persona keyword opportunities by opportunity score", async () => {
    const result = await agent.discoverOpportunities({
      personaId: 101,
      limit: 2,
    });

    expect(result.opportunities).toHaveLength(2);
    expect(result.summary.limit).toBe(2);
    expect(result.summary.dominantIntent).toBeDefined();
    expect(
      result.opportunities[0].opportunityScore,
    ).toBeGreaterThanOrEqual(result.opportunities[1].opportunityScore);
  });
});
