import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { InternalLinkingService } from "../services/seo/internal-linking.service.js";

describe("InternalLinkingService", () => {
  const prisma = {} as unknown as Record<string, unknown>;
  let service: InternalLinkingService;

  beforeEach(() => {
    service = new InternalLinkingService(prisma as any);
    jest.clearAllMocks();
  });

  it("returns deterministic link suggestions", async () => {
    const generateEmbeddingSpy = jest
      .spyOn(service as unknown as { generateEmbedding: (text: string) => Promise<number[]> }, "generateEmbedding")
      .mockResolvedValue([0.1, 0.2]);

    const relatedPages = [
      { url: "/pillar", title: "Pillar", keyword: "automation", relevance: 0.92 },
      { url: "/supporting-1", title: "Support One", keyword: "marketing", relevance: 0.83 },
      { url: "/supporting-2", title: "Support Two", keyword: "crm", relevance: 0.78 },
    ];

    const findRelatedPagesSpy = jest
      .spyOn(service as unknown as { findRelatedPagesByEmbedding: () => Promise<typeof relatedPages> }, "findRelatedPagesByEmbedding")
      .mockResolvedValue(relatedPages as any);

    const generateAnchorTextSpy = jest
      .spyOn(service as unknown as { generateAnchorText: () => Promise<string> }, "generateAnchorText")
      .mockImplementation(async (_content: string, keyword: string) => `${keyword} insights`);

    jest
      .spyOn(service as unknown as { findBestPosition: () => { paragraph: number; sentence: number; beforeText: string; afterText: string } }, "findBestPosition")
      .mockReturnValue({ paragraph: 0, sentence: 0, beforeText: "Start", afterText: "End" });

    jest
      .spyOn(service as unknown as { calculatePriority: () => "high" }, "calculatePriority")
      .mockReturnValue("high");

    const suggestions = await service.suggestLinks({
      currentPageUrl: "/current",
      currentPageContent: "Paragraph one. Marketing automation drives growth. Another section.",
      targetKeyword: "marketing automation",
      maxSuggestions: 2,
    });

    expect(generateEmbeddingSpy).toHaveBeenCalledWith(expect.stringContaining("Paragraph one"));
    expect(findRelatedPagesSpy).toHaveBeenCalledWith([0.1, 0.2], "/current", 4);
    expect(generateAnchorTextSpy).toHaveBeenCalledTimes(2);
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0]).toMatchObject({
      targetUrl: "/pillar",
      anchorText: expect.stringContaining("automation"),
      priority: "high",
    });
    expect(suggestions[0].relevanceScore).toBeGreaterThanOrEqual(suggestions[1].relevanceScore);
  });

  it("flags generic anchor text", () => {
    const result = service.validateAnchorText("click here");

    expect(result.isValid).toBe(false);
    expect(result.issues).toContain("Generic anchor text detected");
    expect(result.score).toBeLessThan(100);
  });

  it("finds a logical insertion point in content", () => {
    const position = service.findBestPosition(
      "Intro paragraph.\n\nMarketing automation accelerates growth and improves conversion rates.",
      "marketing automation"
    );

    expect(position).toMatchObject({
      paragraph: 1,
      sentence: 0,
    });
    expect(position.beforeText).toBeTruthy();
  });
});
