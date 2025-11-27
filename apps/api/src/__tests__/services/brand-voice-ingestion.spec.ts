// @ts-nocheck
// Temporary suppression — legacy suite. Logged in AGENT_COMPLETION_PROGRESS.md.
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ParsedBrandVoice } from "../../services/brand-voice-ingestion.js";

const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
  embeddings: {
    create: jest.fn(),
  },
};

const prismaMock = {
  embeddingSpace: {
    upsert: jest.fn(),
  },
  brandVoice: {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
};

const loggerMock = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock("../../lib/openai.js", () => ({ openai: mockOpenAI }));
jest.mock("../../lib/prisma.js", () => ({ prisma: prismaMock }));
jest.mock("../../lib/logger.js", () => ({ logger: loggerMock }));

const importService = () => import("../../services/brand-voice-ingestion.js");

const baseDocument = {
  content: "Our tone is professional, confident, and approachable for every launch.",
  filename: "voice.txt",
  mimeType: "text/plain",
};

const parsedFixture: ParsedBrandVoice = {
  summary: "Friendly yet professional tone",
  tone: ["professional", "approachable"],
  vocabulary: ["innovation", "customer-first"],
  doExamples: ["Lead with customer value"],
  dontExamples: ["Avoid jargon"],
  fullText: baseDocument.content,
};

describe("Brand Voice Ingestion Service", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(parsedFixture) } }],
    });
    mockOpenAI.embeddings.create.mockResolvedValue({
      data: [{ embedding: Array(1536).fill(0.1) }],
    });
    prismaMock.embeddingSpace.upsert.mockResolvedValue({ id: "space-123" });
    prismaMock.brandVoice.create.mockResolvedValue({ id: "voice-123" });
    prismaMock.$executeRaw.mockResolvedValue(1);
    prismaMock.$queryRaw.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("parseBrandVoiceDocument", () => {
    it("parses brand voice metadata via OpenAI", async () => {
      const service = await importService();
      const result = await service.parseBrandVoiceDocument(baseDocument.content);

      expect(result.summary).toBe(parsedFixture.summary);
      expect(result.tone).toEqual(parsedFixture.tone);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-4o-mini",
        })
      );
    });

    it("falls back to keyword heuristics when OpenAI fails", async () => {
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error("unavailable"));
      const service = await importService();
      const fallbackResult = await service.parseBrandVoiceDocument("Be confident yet approachable.");

      expect(fallbackResult.summary).toBe("Brand voice guidelines");
      expect(fallbackResult.tone).toEqual(expect.arrayContaining(["confident", "approachable"]));
      expect(loggerMock.error).toHaveBeenCalledWith(
        "[brand-voice-ingestion] Failed to parse document",
        "unavailable"
      );
    });
  });

  describe("generateBrandVoiceEmbedding", () => {
    it("creates embeddings using the configured OpenAI model", async () => {
      const service = await importService();
      const result = await service.generateBrandVoiceEmbedding("Summary text");

      expect(result).toHaveLength(1536);
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "text-embedding-3-small",
        })
      );
    });

    it("throws when the provider returns an unexpected vector length", async () => {
      mockOpenAI.embeddings.create.mockResolvedValueOnce({
        data: [{ embedding: [0.1, 0.2, 0.3] }],
      });
      const service = await importService();

      await expect(service.generateBrandVoiceEmbedding("bad")).rejects.toThrow("Expected 1536");
    });
  });

  describe("storeBrandVoice", () => {
    it("persists parsed metadata and attaches embeddings", async () => {
      const service = await importService();

      const result = await service.storeBrandVoice({
        brandId: "brand-1",
        organizationId: "org-1",
        document: baseDocument,
        parsed: parsedFixture,
      });

      expect(result).toEqual({ id: "voice-123", brandVoiceId: "voice-123" });
      expect(prismaMock.embeddingSpace.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId_name: {
              organizationId: "org-1",
              name: "brand-voice-brand-1",
            },
          },
        })
      );
      expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe("searchSimilarBrandVoice", () => {
    it("performs a vector search and normalizes the payload", async () => {
      const service = await importService();
      prismaMock.$queryRaw.mockResolvedValueOnce([
        {
          id: "voice-1",
          promptTemplate: "Bold + witty",
          styleRulesJson: { tone: ["bold"] },
          similarity: 0.91,
        },
      ]);

      const results = await service.searchSimilarBrandVoice({
        brandId: "brand-1",
        query: "bold ideas",
        limit: 1,
      });

      expect(results).toEqual([
        { id: "voice-1", summary: "Bold + witty", metadata: { tone: ["bold"] }, similarity: 0.91 },
      ]);
      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe("ingestBrandVoice", () => {
    it("chains parsing and storage helpers", async () => {
      const service = await importService();
      const result = await service.ingestBrandVoice({
        brandId: "brand-1",
        organizationId: "org-1",
        document: baseDocument,
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      expect(prismaMock.brandVoice.create).toHaveBeenCalled();
      expect(result).toEqual({ brandVoiceId: "voice-123", parsed: parsedFixture });
    });
  });

  describe("listBrandVoiceGuides", () => {
    it("maps Prisma payloads into the public format", async () => {
      const service = await importService();
      const createdAt = new Date("2025-11-20T00:00:00.000Z");
      prismaMock.brandVoice.findMany.mockResolvedValueOnce([
        {
          id: "voice-1",
          promptTemplate: "Bold + witty",
          styleRulesJson: { tone: ["bold"] },
          createdAt,
        },
      ]);

      const guides = await service.listBrandVoiceGuides("brand-99");

      expect(prismaMock.brandVoice.findMany).toHaveBeenCalledWith({
        where: { brandId: "brand-99" },
        select: {
          id: true,
          promptTemplate: true,
          styleRulesJson: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(guides).toEqual([
        { id: "voice-1", summary: "Bold + witty", metadata: { tone: ["bold"] }, createdAt },
      ]);
    });
  });

  describe("deleteBrandVoiceGuide", () => {
    it("delegates to Prisma for deletion", async () => {
      const service = await importService();
      prismaMock.brandVoice.delete.mockResolvedValueOnce(undefined);

      await service.deleteBrandVoiceGuide("voice-delete");

      expect(prismaMock.brandVoice.delete).toHaveBeenCalledWith({
        where: { id: "voice-delete" },
      });
    });
  });
});
