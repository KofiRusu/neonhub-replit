import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ContentAgent } from "../../agents/content/ContentAgent.js";
import type { QualityScore } from "../../agents/content/ContentAgent.js";

const mockRagBuild = jest.fn().mockResolvedValue({
  brandVoice: [],
  knowledge: [],
  memories: [],
});
const mockRagFormat = jest.fn().mockReturnValue("");
const mockKnowledgeIngest = jest.fn().mockResolvedValue(undefined);
const mockInternalLinkSuggestions = [
  {
    targetUrl: "/content/example",
    targetTitle: "Example Content",
    anchorText: "Automation",
    priority: "high",
    position: { paragraph: 0 },
  },
];

jest.mock("../../services/rag/context.service.js", () => ({
  RagContextService: jest.fn().mockImplementation(() => ({
    build: mockRagBuild,
    formatForPrompt: mockRagFormat,
  })),
}));

jest.mock("../../services/rag/knowledge.service.js", () => ({
  KnowledgeBaseService: jest.fn().mockImplementation(() => ({
    ingestSnippet: mockKnowledgeIngest,
    retrieveSnippets: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock("../../services/seo/internal-linking.service.js", () => ({
  InternalLinkingService: jest.fn().mockImplementation(() => ({
    suggestLinks: jest.fn(async () => mockInternalLinkSuggestions),
  })),
}));

jest.mock("../../agents/base/AgentJobManager.js", () => ({
  agentJobManager: {
    createJob: jest.fn(),
    startJob: jest.fn(),
    completeJob: jest.fn(),
    failJob: jest.fn(),
  },
}));

jest.mock("../../ws/index.js", () => ({
  broadcast: jest.fn(),
}));

const FIXED_DATE = new Date("2025-02-01T12:00:00.000Z");

describe("ContentAgent", () => {
  let prismaMock: any;
  let jobManagerMock: any;
  let seoAgentMock: any;
  let brandVoiceSearchMock: ReturnType<typeof jest.fn>;
  let generateTextMock: ReturnType<typeof jest.fn>;
  let agent: ContentAgent;

  beforeEach(() => {
    mockRagBuild.mockClear().mockResolvedValue({
      brandVoice: [],
      knowledge: [],
      memories: [],
    });
    mockRagFormat.mockClear().mockReturnValue("");
    mockKnowledgeIngest.mockClear();

    const createDraft = jest.fn(async () => ({
      id: "draft-1",
      title: "Marketing Automation Blueprint",
      topic: "Marketing automation frameworks",
    }));
    const updateDraft = jest.fn(async () => undefined);
    const findDraft = jest.fn(async () => ({
      title: "Marketing Automation Blueprint",
      topic: "Marketing automation frameworks",
      organizationId: "org-1",
      createdById: "user-1",
    }));

    prismaMock = {
      organizationMembership: {
        findFirst: jest.fn(async () => ({ organizationId: "org-1" })),
      },
      brandVoice: {
        findUnique: jest.fn(async () => ({
          promptTemplate: "Favor decisive, forward-looking language.",
          styleRulesJson: {
            tone: ["authoritative", "optimistic"],
            vocabulary: ["automation", "workflow", "pipeline"],
            doExamples: ["Use vivid verbs", "Highlight measurable outcomes"],
            dontExamples: ["Avoid jargon"],
          },
          brand: {
            id: "brand-1",
            name: "NeonHub",
            slogan: "Illuminate your growth",
            metadata: { website: "https://neonhub.example" },
          },
        })),
      },
      brand: {
        findUnique: jest.fn(async () => null),
      },
      contentDraft: {
        create: createDraft,
        update: updateDraft,
        findUnique: findDraft,
      },
      editorialCalendar: {
        create: jest.fn(async () => ({ id: 101 })),
      },
    } as any;

    jobManagerMock = {
      createJob: jest.fn(async () => "job-1"),
      startJob: jest.fn(async () => undefined),
      completeJob: jest.fn(async () => undefined),
      failJob: jest.fn(async () => undefined),
    } as any;

    seoAgentMock = {
      discoverOpportunities: jest.fn(async () => ({
        opportunities: [
          {
            keyword: "marketing automation",
            intent: "informational",
            opportunityScore: 78,
            difficulty: 42,
            searchVolume: 3200,
          },
          {
            keyword: "marketing automation workflow",
            intent: "commercial",
            opportunityScore: 64,
            difficulty: 48,
            searchVolume: 1800,
          },
        ],
        summary: {},
      })),
    } as any;

    brandVoiceSearchMock = jest
      .fn()
      .mockImplementation(() => Promise.resolve([{ summary: "Keep messaging energetic and data-backed." }]));

    generateTextMock = jest.fn();
    generateTextMock
      .mockImplementationOnce(async () => ({
        text: JSON.stringify({
          title: "Marketing Automation Blueprint",
          summary: "Learn how to orchestrate automation that delights buyers.",
          sections: [
            { heading: "Why automation matters", body: "Automation drives consistency." },
            { heading: "Framework essentials", body: "Focus on triggers, actions, and data governance." },
          ],
          conclusion: "Treat automation as an ongoing program.",
          callToAction: "Book a workflow audit with NeonHub.",
        }),
        model: "mock",
        mock: false,
      }))
      .mockImplementationOnce(async () => ({
        text: JSON.stringify({
          linkedin: "Automation unlocks marketing scale. Here is how leaders orchestrate it.",
          twitter: "Marketing automation ≠ set-and-forget. Build adaptive workflows. #automation",
          emailSubject: "Blueprint: Adaptive marketing automation",
        }),
        model: "mock",
        mock: false,
      }));

    agent = new ContentAgent({
      prisma: prismaMock,
      jobManager: jobManagerMock,
      seoAgent: seoAgentMock,
      brandVoiceSearch: brandVoiceSearchMock as any,
      generateText: generateTextMock as any,
      now: () => FIXED_DATE,
    });
  });

  it("generates an article with meta tags, schema, and quality metrics", async () => {
    const output = await agent.generateArticle({
      topic: "Marketing automation frameworks",
      primaryKeyword: "marketing automation",
      createdById: "user-1",
      brandVoiceId: "voice-1",
      tone: "authoritative",
      audience: "Revenue operations leaders",
    });

    expect(jobManagerMock.createJob).toHaveBeenCalled();
    expect(jobManagerMock.completeJob).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({
        draftId: "draft-1",
        meta: expect.objectContaining({
          title: expect.any(String),
          description: expect.any(String),
        }),
        schema: expect.objectContaining({
          article: expect.stringContaining("\"@type\": \"Article\""),
        }),
      }),
      expect.any(Object)
    );

    expect(output.draftId).toBe("draft-1");
    expect(output.meta.title.length).toBeLessThanOrEqual(60);
    expect(output.meta.description.length).toBeGreaterThanOrEqual(150);
    expect(output.schema.article).toContain("\"Article\"");
    expect(output.socialSnippets.linkedin).toContain("Automation");
    expect(output.quality.readability.words).toBeGreaterThan(0);
  });

  it("optimizes existing content and updates draft when provided", async () => {
    generateTextMock.mockReset().mockImplementation(() =>
      Promise.resolve({
        text: JSON.stringify({
          revision: "Revised body with marketing automation emphasis.",
          notes: ["Elevated keyword density", "Improved clarity"],
        }),
        model: "mock",
        mock: false,
      })
    );

    const result = await agent.optimizeArticle({
      draftId: "draft-1",
      content: "Original body text.",
      primaryKeyword: "marketing automation",
      createdById: "user-1",
    });

    expect(prismaMock.contentDraft.update).toHaveBeenCalledWith({
      where: { id: "draft-1" },
      data: { body: "Revised body with marketing automation emphasis." },
    });
    expect(result.notes).toContain("Elevated keyword density");
    expect((result.quality as QualityScore).overall).toBeGreaterThanOrEqual(0);
  });

  it("scores content quality deterministically", () => {
    const score = agent.scoreContent(
      "Marketing automation streamlines campaigns. It improves consistency across teams.",
      ["marketing automation"]
    );

    expect(score.readability.fleschEase).toBeGreaterThan(0);
    expect(score.keywordDensity[0].keyword).toBe("marketing automation");
  });

  it("schedules publication in the editorial calendar", async () => {
    await agent.schedulePublication({
      draftId: "draft-1",
      publishAt: new Date("2025-03-01T10:00:00Z"),
      personaId: 101,
      channel: "blog",
    });

    expect(prismaMock.editorialCalendar.create).toHaveBeenCalledWith({
      data: {
        title: "Marketing Automation Blueprint",
        publishAt: new Date("2025-03-01T10:00:00.000Z"),
        status: "scheduled:blog",
        personaId: 101,
        priority: 50,
      },
    });
  });
});
