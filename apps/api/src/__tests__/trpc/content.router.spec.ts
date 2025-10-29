import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { contentRouter } from "../../trpc/routers/content.router.js";
import { contentAgent } from "../../agents/content/ContentAgent.js";

describe("contentRouter", () => {
  const ctx: any = {
    prisma: {
      brand: {
        findUnique: jest.fn(),
      },
      contentDraft: {
        findUnique: jest.fn(),
      },
    },
    user: { id: "user-1" },
  };

  beforeEach(() => {
    ctx.prisma.brand.findUnique.mockReset();
    ctx.prisma.brand.findUnique.mockResolvedValue({
      organization: {
        members: [{ userId: "user-1", status: "active" }],
      },
    });

    ctx.prisma.contentDraft.findUnique.mockReset();
    ctx.prisma.contentDraft.findUnique.mockResolvedValue({
      createdById: "user-1",
    });

    jest.spyOn(contentAgent, "generateArticle").mockResolvedValue({
      jobId: "job-1",
      draftId: "draft-1",
      title: "Automation Blueprint",
      summary: "Summary",
      body: "# Body",
      meta: {
        title: "Automation Blueprint",
        description: "Description",
        openGraph: { title: "OG", description: "Description", type: "article" },
        twitter: { card: "summary_large_image", title: "Automation Blueprint", description: "Description" },
      },
      schema: { article: "{}", organization: "{}", breadcrumb: "{}" },
      keywordInsights: [],
      quality: {
        readability: { fleschEase: 65, gradeBand: "Standard", words: 200, sentences: 10, paragraphs: 4, avgSentenceLength: 20 },
        keywordDensity: [],
        overall: 78,
      },
      socialSnippets: { linkedin: "", twitter: "", emailSubject: "" },
    } as any);

    jest.spyOn(contentAgent, "optimizeArticle").mockResolvedValue({
      jobId: "job-2",
      revisedContent: "Revised",
      notes: ["Updated intros"],
      quality: {
        readability: { fleschEase: 62, gradeBand: "Standard", words: 150, sentences: 8, paragraphs: 3, avgSentenceLength: 18 },
        keywordDensity: [],
        overall: 75,
      },
    });

    jest.spyOn(contentAgent, "schedulePublication").mockResolvedValue(undefined);
    jest.spyOn(contentAgent, "scoreContent").mockReturnValue({
      readability: { fleschEase: 70, gradeBand: "Fairly Easy", words: 100, sentences: 5, paragraphs: 2, avgSentenceLength: 20 },
      keywordDensity: [],
      overall: 80,
    });

    jest.spyOn(contentAgent, "generateMetaTagsForContent").mockReturnValue({
      title: "Meta",
      description: "Meta description",
      openGraph: { title: "OG", description: "Meta description", type: "article" },
      twitter: { card: "summary_large_image", title: "Meta", description: "Meta description" },
    } as any);

    jest.spyOn(contentAgent, "generateSocialSnippets").mockResolvedValue({
      linkedin: "LinkedIn copy",
      twitter: "Tweet copy",
      emailSubject: "Email subject",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calls contentAgent.generateArticle with validated input", async () => {
    const caller = contentRouter.createCaller(ctx);

    const result = await caller.generateArticle({
      topic: "Automation roadmap",
      primaryKeyword: "marketing automation",
      brandId: "ckv1234567890abcdef123456",
    });

    expect(contentAgent.generateArticle).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: "Automation roadmap",
        primaryKeyword: "marketing automation",
        createdById: "user-1",
      })
    );
    expect(result.draftId).toBe("draft-1");
  });

  it("schedules publication for owned drafts only", async () => {
    const caller = contentRouter.createCaller(ctx);

    await caller.schedulePublish({
      draftId: "ckv1234567890abcdef123456",
      publishAt: new Date().toISOString(),
      channel: "blog",
    });

    expect(contentAgent.schedulePublication).toHaveBeenCalled();
  });

  it("throws when brand access is denied", async () => {
    ctx.prisma.brand.findUnique.mockResolvedValue({
      organization: { members: [] },
    });

    const caller = contentRouter.createCaller(ctx);

    await expect(
      caller.generateArticle({
        topic: "Automation roadmap",
        primaryKeyword: "marketing automation",
        brandId: "ckv1234567890abcdef123456",
      })
    ).rejects.toThrow("You do not have access to this brand.");
  });
});
