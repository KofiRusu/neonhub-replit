import { describe, it, expect, beforeEach, beforeAll, jest } from "@jest/globals";
import type { PrismaClient } from "@prisma/client";
import {
  suggestInternalLinks,
  generateAnchorText,
  trackLinkGraph,
} from "../../services/internal-linking.js";

jest.mock("../../lib/openai.js", () => ({
  openai: {
    embeddings: {
      create: jest.fn(),
    },
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

type OpenAIMock = {
  embeddings: { create: jest.Mock };
  chat: { completions: { create: jest.Mock } };
};

let openaiMock: OpenAIMock;

beforeAll(async () => {
  const module = await import("../../lib/openai.js");
  openaiMock = module.openai as unknown as OpenAIMock;
});

type PrismaMock = {
  content: { findUnique: jest.Mock; findMany: jest.Mock };
  $queryRaw: jest.Mock;
  linkGraph: { upsert: jest.Mock };
};

const createPrismaMock = () =>
  ({
    content: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    linkGraph: {
      upsert: jest.fn(),
    },
  }) as unknown as PrismaClient;

describe("Internal linking service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("suggests internal links based on vector similarity", async () => {
    const prisma = createPrismaMock();
    const prismaAny = prisma as unknown as PrismaMock;

    prismaAny.content.findUnique.mockImplementation(() =>
      Promise.resolve({
        id: "content-a",
        organizationId: "org-1",
        status: "published",
      }),
    );

    openaiMock.embeddings.create.mockImplementation(() =>
      Promise.resolve({
        data: [{ embedding: [0.1, 0.2, 0.3] }],
      }),
    );

    prismaAny.$queryRaw.mockImplementation(() =>
      Promise.resolve([
        { targetDocumentId: "doc-1", title: "Neon Marketing Tactics", distance: 0.25 },
        { targetDocumentId: "doc-2", title: "Event Lighting Playbook", distance: 0.4 },
      ]),
    );

    prismaAny.content.findMany.mockImplementation(() =>
      Promise.resolve([
        {
          id: "content-b",
          title: "Neon Marketing Tactics",
          metadata: { documentId: "doc-1" },
        },
        {
          id: "content-c",
          title: "Event Lighting Playbook",
          metadata: { documentId: "doc-2" },
        },
      ]),
    );

    openaiMock.chat.completions.create.mockImplementation(() =>
      Promise.resolve({
        choices: [{ message: { content: "neon campaign strategy" } }],
      }),
    );

    const suggestions = await suggestInternalLinks({
      contentId: "content-a",
      content: "Neon marketing automation strategies for omnichannel campaigns.",
      limit: 2,
      prisma,
    });

    expect(openaiMock.embeddings.create).toHaveBeenCalled();
    expect(prismaAny.$queryRaw).toHaveBeenCalled();
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0]).toMatchObject({
      targetContentId: "content-b",
      anchorText: "neon campaign strategy",
    });
    expect(suggestions[0].similarity).toBeGreaterThan(suggestions[1].similarity);
  });

  it("falls back to keyword-based anchor text when model fails", async () => {
    openaiMock.chat.completions.create.mockImplementation(() => Promise.reject(new Error("API unavailable")));

    const anchor = await generateAnchorText({
      sourceContent: "Short overview about neon signage.",
      targetTitle: "Neon Signage Basics",
      keyword: "neon signage",
    });

    expect(anchor).toBe("neon signage");
  });

  it("tracks link graph relationships for later analysis", async () => {
    const prisma = createPrismaMock();
    const prismaAny = prisma as unknown as PrismaMock;

    prismaAny.content.findUnique
      .mockImplementationOnce(() => Promise.resolve({ id: "content-a", organizationId: "org-1" }))
      .mockImplementationOnce(() => Promise.resolve({ id: "content-b" }));

    prismaAny.linkGraph.upsert.mockImplementation(() =>
      Promise.resolve({
        id: "link-1",
        sourceContentId: "content-a",
        targetContentId: "content-b",
        anchorText: "neon marketing tactics",
      }),
    );

    const result = await trackLinkGraph({
      sourceContentId: "content-a",
      targetContentId: "content-b",
      anchorText: "neon marketing tactics",
      similarity: 0.82,
      prisma,
    });

    expect(prismaAny.content.findUnique).toHaveBeenCalledTimes(2);
    expect(prismaAny.linkGraph.upsert).toHaveBeenCalledWith({
      where: {
        sourceContentId_targetContentId_anchorText: {
          sourceContentId: "content-a",
          targetContentId: "content-b",
          anchorText: "neon marketing tactics",
        },
      },
      update: { similarity: 0.82 },
      create: {
        organizationId: "org-1",
        sourceContentId: "content-a",
        targetContentId: "content-b",
        anchorText: "neon marketing tactics",
        similarity: 0.82,
      },
    });
    expect(result).toEqual(
      expect.objectContaining({ sourceContentId: "content-a", targetContentId: "content-b" })
    );
  });
});
