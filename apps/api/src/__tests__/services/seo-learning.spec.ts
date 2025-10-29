import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { PrismaClient } from "@prisma/client";
import { identifyUnderperformers, autoOptimizeContent } from "../../services/seo-learning.js";

type PrismaStub = {
  sEOMetric: {
    findMany: jest.Mock;
  };
  content: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

function createPrismaStub(): PrismaStub & PrismaClient {
  return {
    sEOMetric: {
      findMany: jest.fn(),
    },
    content: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaStub & PrismaClient;
}

describe("seo-learning service", () => {
  let prisma: PrismaStub & PrismaClient;

  beforeEach(() => {
    prisma = createPrismaStub();
  });

  it("identifies underperforming content based on CTR and position trends", async () => {
    const now = new Date();
    prisma.sEOMetric.findMany.mockImplementation(() =>
      Promise.resolve([
        {
          organizationId: "org-1",
          contentId: "content-1",
          url: "https://example.com/content-1",
          keyword: "neon marketing",
        impressions: 2000,
        clicks: 40,
        ctr: 0.02,
        avgPosition: 5.0,
        date: new Date(now.getTime() - 86400000),
      },
        {
          organizationId: "org-1",
          contentId: "content-1",
          url: "https://example.com/content-1",
          keyword: "neon marketing",
        impressions: 2500,
        clicks: 20,
        ctr: 0.008,
          avgPosition: 8.5,
          date: now,
        },
      ]),
    );

    const results = await identifyUnderperformers({
      organizationId: "org-1",
      prisma,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      contentId: "content-1",
      issue: "low_ctr",
    });
  });

  it("records optimisation recommendations on content metadata", async () => {
    prisma.sEOMetric.findMany
      .mockImplementationOnce(() =>
        Promise.resolve([
          {
            organizationId: "org-1",
            contentId: "content-2",
            url: "https://example.com/content-2",
            keyword: "internal linking",
            impressions: 1500,
            clicks: 20,
            ctr: 0.013,
            avgPosition: 11.5,
            date: new Date(),
          },
        ]),
      )
      .mockImplementationOnce(() => Promise.resolve([]));

    prisma.content.findUnique.mockImplementation(() =>
      Promise.resolve({
        id: "content-2",
        metadata: { existing: true },
      }),
    );

    prisma.content.update.mockImplementation(() => Promise.resolve({ id: "content-2" }));

    await autoOptimizeContent({ contentId: "content-2", prisma });

    expect(prisma.content.update).toHaveBeenCalledWith({
      where: { id: "content-2" },
      data: expect.objectContaining({
        metadata: expect.anything(),
      }),
    });
  });
});
