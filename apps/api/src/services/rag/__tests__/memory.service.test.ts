import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import type { Prisma } from "@prisma/client";
import { MemoryRagService } from "../../rag/memory.service.js";
import * as embeddings from "../../../ai/embeddings.js";

type MemoryRecord = {
  id: string;
  organizationId: string;
  personId: string;
  label: string | null;
  metadata: Prisma.JsonValue | null;
  embedding: number[];
};

interface MemoryTestContext {
  lastEmbedding: number[];
  currentSearch: {
    organizationId: string;
    personId?: string;
    query: string;
    limit?: number;
  } | null;
}

function vectorFor(text: string): number[] {
  const base = text.length || 1;
  return [base % 7, (base * 3) % 11, (base * 5) % 13];
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
  if (Array.isArray(value)) {
    return value.map((entry) => Number(entry));
  }
  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { values?: number[] }).values)
  ) {
    return (value as { values: number[] }).values.map((entry) => Number(entry));
  }
  return [];
}

function createMemoryPrismaMock(context: MemoryTestContext): Record<string, unknown> {
  const records: MemoryRecord[] = [];
  let counter = 0;

  return {
    memEmbedding: {
      create: jest.fn(async ({ data }) => {
        const id = `mem_${++counter}`;
        const record: MemoryRecord = {
          id,
          organizationId: data.organizationId,
          personId: data.personId,
          label: data.label ?? null,
          metadata: data.metadata ?? null,
          embedding: [],
        };
        records.push(record);
        return { ...data, id };
      }),
    } as unknown as Prisma.PrismaClient["memEmbedding"],
    $executeRaw: jest.fn(async (_strings, ...values: unknown[]) => {
      const embedding = extractVector(values[0]);
      const recordId = values[1] as string;
      const record = records.find((entry) => entry.id === recordId);
      if (record) {
        record.embedding = embedding;
      }
    }),
    $queryRaw: jest.fn(async () => {
      const search = context.currentSearch;
      if (!search) return [];
      const queryVector = context.lastEmbedding;
      return records
        .filter(
          (record) =>
            record.organizationId === search.organizationId &&
            (!search.personId || record.personId === search.personId),
        )
        .map((record) => ({
          id: record.id,
          label: record.label,
          metadata: record.metadata,
          similarity: cosineSimilarity(queryVector, record.embedding),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, search.limit ?? 5);
    }),
  };
}

describe("MemoryRagService", () => {
  const context: MemoryTestContext = {
    lastEmbedding: [],
    currentSearch: null,
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    context.lastEmbedding = [];
    context.currentSearch = null;
  });

  it("stores and retrieves snippets ordered by similarity", async () => {
    const embedSpy = jest
      .spyOn(embeddings, "embedText")
      .mockImplementation(async (text: string) => {
        const vector = vectorFor(text);
        context.lastEmbedding = vector;
        return vector;
      });

    const prismaMock = createMemoryPrismaMock(context);
    const service = new MemoryRagService(prismaMock as any);

    await service.storeSnippet({
      organizationId: "org-1",
      personId: "person-1",
      label: "alpha memory",
      text: "Alpha product release was well received.",
      category: "content",
    });

    await service.storeSnippet({
      organizationId: "org-1",
      personId: "person-1",
      label: "beta note",
      text: "Beta launch feedback pending.",
      category: "content",
    });

    context.currentSearch = {
      organizationId: "org-1",
      personId: "person-1",
      query: "Alpha roadmaps",
      limit: 2,
    };

    const results = await service.searchSnippets(context.currentSearch);
    expect(results).toHaveLength(2);
    expect(results.map((entry) => entry.label)).toEqual(
      expect.arrayContaining(["alpha memory", "beta note"]),
    );
    expect(results[0]!.similarity).toBeGreaterThanOrEqual(results[1]!.similarity);
    expect(embedSpy).toHaveBeenCalled();
  });
});
