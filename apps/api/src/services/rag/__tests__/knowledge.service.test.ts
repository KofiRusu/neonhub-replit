import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import type { Prisma } from "@prisma/client";
import { KnowledgeBaseService } from "../../rag/knowledge.service.js";
import * as embeddings from "../../../ai/embeddings.js";

type ChunkRecord = {
  id: string;
  datasetId: string;
  documentId: string;
  text: string;
  metadata: Prisma.JsonValue | null;
  embedding: number[];
};

interface KnowledgeTestContext {
  lastEmbedding: number[];
  currentRetrieve: {
    organizationId: string;
    datasetSlug: string;
    query: string;
    limit?: number;
  } | null;
}

function vectorFor(text: string): number[] {
  const base = text.length || 1;
  return [base % 5, (base * 7) % 11, (base * 9) % 13];
}

function dot(a: number[], b: number[]): number {
  return a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
}

function magnitude(vec: number[]): number {
  return Math.sqrt(vec.reduce((sum, value) => sum + value * value, 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
  const denom = magnitude(a) * magnitude(b);
  if (denom === 0) return 0;
  return dot(a, b) / denom;
}

function extractVector(value: unknown): number[] {
  if (Array.isArray(value)) return value.map((entry) => Number(entry));
  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { values?: number[] }).values)
  ) {
    return (value as { values: number[] }).values.map((entry) => Number(entry));
  }
  return [];
}

function createKnowledgePrismaMock(
  context: KnowledgeTestContext,
): Record<string, unknown> {
  let embeddingSpaceCounter = 0;
  let datasetCounter = 0;
  let documentCounter = 0;
  let chunkCounter = 0;
  const chunks: ChunkRecord[] = [];
  const embeddingSpaces = new Map<string, { id: string; organizationId: string; name: string }>();
  const datasets = new Map<
    string,
    { id: string; organizationId: string; slug: string; embeddingSpaceId?: string }
  >();

  return {
    embeddingSpace: {
      findFirst: jest.fn(async ({ where }) => {
        const entry = Array.from(embeddingSpaces.values()).find(
          (space) => space.organizationId === where?.organizationId && space.name === where?.name,
        );
        return entry ? { id: entry.id } : null;
      }),
      create: jest.fn(async ({ data }) => {
        const id = `es_${++embeddingSpaceCounter}`;
        embeddingSpaces.set(`${data.organizationId}:${data.name}`, {
          id,
          organizationId: data.organizationId,
          name: data.name,
        });
        return { id };
      }),
    } as unknown as Prisma.PrismaClient["embeddingSpace"],
    dataset: {
      findFirst: jest.fn(async ({ where }) => {
        const key = `${where?.organizationId}:${where?.slug}`;
        const entry = datasets.get(key);
        if (!entry) return null;
        return { id: entry.id, embeddingSpaceId: entry.embeddingSpaceId ?? null };
      }),
      create: jest.fn(async ({ data }) => {
        const id = `ds_${++datasetCounter}`;
        datasets.set(`${data.organizationId}:${data.slug}`, {
          id,
          organizationId: data.organizationId,
          slug: data.slug,
          embeddingSpaceId: data.embeddingSpace.connect?.id,
        });
        return { id };
      }),
      update: jest.fn(async ({ where, data }) => {
        for (const [key, entry] of datasets.entries()) {
          if (entry.id === where.id) {
            datasets.set(key, { ...entry, embeddingSpaceId: data.embeddingSpaceId as string });
          }
        }
        return { id: where.id };
      }),
    } as unknown as Prisma.PrismaClient["dataset"],
    document: {
      create: jest.fn(async ({ data }) => {
        const id = `doc_${++documentCounter}`;
        return { ...data, id };
      }),
    } as unknown as Prisma.PrismaClient["document"],
    chunk: {
      create: jest.fn(async ({ data }) => {
        const id = `chunk_${++chunkCounter}`;
        chunks.push({
          id,
          datasetId: data.datasetId,
          documentId: data.documentId,
          text: data.text,
          metadata: data.metadata,
          embedding: [],
        });
        return { ...data, id };
      }),
    } as unknown as Prisma.PrismaClient["chunk"],
    $executeRaw: jest.fn(async (_strings, ...values: unknown[]) => {
      const embedding = extractVector(values[0]);
      const id = values[1] as string;
      const chunk = chunks.find((entry) => entry.id === id);
      if (chunk) {
        chunk.embedding = embedding;
      }
    }),
    $queryRaw: jest.fn(async () => {
      const retrieve = context.currentRetrieve;
      if (!retrieve) return [];
      const dataset = datasets.get(`${retrieve.organizationId}:${retrieve.datasetSlug}`);
      if (!dataset) return [];
      const queryVector = context.lastEmbedding;
      return chunks
        .filter((chunk) => chunk.datasetId === dataset.id)
        .map((chunk) => ({
          id: chunk.id,
          text: chunk.text,
          metadata: chunk.metadata,
          title: `Doc-${chunk.documentId}`,
          similarity: cosineSimilarity(queryVector, chunk.embedding),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, retrieve.limit ?? 5);
    }),
  };
}

describe("KnowledgeBaseService", () => {
  const context: KnowledgeTestContext = {
    lastEmbedding: [],
    currentRetrieve: null,
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    context.lastEmbedding = [];
    context.currentRetrieve = null;
  });

  it("ingests snippets and retrieves similar chunks", async () => {
    const embedSpy = jest
      .spyOn(embeddings, "embedText")
      .mockImplementation(async (text: string) => {
        const vector = vectorFor(text);
        context.lastEmbedding = vector;
        return vector;
      });

    const prismaMock = createKnowledgePrismaMock(context);
    const service = new KnowledgeBaseService(prismaMock as any);

    await service.ingestSnippet({
      organizationId: "org-1",
      datasetSlug: "email-org-1",
      datasetName: "Email Knowledge",
      title: "Welcome series",
      content: "Paragraph one about launches.\n\nSecond paragraph about onboarding.",
      ownerId: "user-1",
      metadata: { channel: "email" },
    });

    context.currentRetrieve = {
      organizationId: "org-1",
      datasetSlug: "email-org-1",
      query: "onboarding guidance",
      limit: 2,
    };

    const snippets = await service.retrieveSnippets(context.currentRetrieve);
    expect(snippets).toHaveLength(2);
    expect(snippets[0]!.similarity).toBeGreaterThanOrEqual(snippets[1]!.similarity);
    expect(snippets.map((snippet) => snippet.text)).toEqual(
      expect.arrayContaining([
        "Paragraph one about launches.",
        "Second paragraph about onboarding.",
      ]),
    );
    expect(embedSpy).toHaveBeenCalled();
  });
});
