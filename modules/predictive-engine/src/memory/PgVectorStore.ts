import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { EmbeddingsProvider } from "./EmbeddingsProvider.js";
import { asString } from "../utils/stringify.js";

type MemoryRecord = {
  agent: string;
  key: string;
  content: string;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
};

export class PgVectorStore {
  private readonly inMemory = new Map<string, MemoryRecord>();
  private readonly useInMemory: boolean;

  constructor(private readonly prisma: PrismaClient | null, private readonly embeddings: EmbeddingsProvider, private readonly dimension = 1536) {
    this.useInMemory = process.env.TEST_MODE === "1" || !prisma;
  }

  async upsert(agent: string, key: string, content: string): Promise<void> {
    const safeAgent = asString(agent);
    const safeKey = asString(key);
    const safeContent = asString(content);

    const embedding = await this.embeddings.embed(safeContent);
    const normalized = this.normalizeVector(embedding);
    const now = new Date();

    if (this.useInMemory) {
      this.inMemory.set(this.composeKey(safeAgent, safeKey), {
        agent: safeAgent,
        key: safeKey,
        content: safeContent,
        embedding: normalized,
        createdAt: now,
        updatedAt: now
      });
      return;
    }

    const vectorSql = this.vectorToSql(normalized);
    await this.prisma!.$executeRaw(
      Prisma.sql`
        INSERT INTO "agent_memories" ("id", "agent", "key", "content", "embedding", "createdAt", "updatedAt")
        VALUES (${randomUUID()}, ${safeAgent}, ${safeKey}, ${safeContent}, ${vectorSql}::vector, ${now}, ${now})
        ON CONFLICT ("agent", "key") DO UPDATE SET
          "content" = EXCLUDED."content",
          "embedding" = EXCLUDED."embedding",
          "updatedAt" = EXCLUDED."updatedAt"
      `
    );
  }

  async query(agent: string, query: string, k = 5): Promise<Array<{ key: string; content: string; similarity: number }>> {
    const safeAgent = asString(agent);
    const safeQuery = asString(query);
    const queryVector = this.normalizeVector(await this.embeddings.embed(safeQuery));

    if (this.useInMemory) {
      const candidates = Array.from(this.inMemory.values()).filter(record => record.agent === safeAgent);
      return candidates
        .map(record => ({
          key: record.key,
          content: record.content,
          similarity: this.cosineSimilarity(record.embedding, queryVector)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k);
    }

    const vectorSql = this.vectorToSql(queryVector);
    const results = await this.prisma!.$queryRaw<Array<{ key: string; content: string; similarity: number }>>(
      Prisma.sql`
        SELECT "key", "content", 1 - (embedding <=> ${vectorSql}::vector) AS similarity
        FROM "agent_memories"
        WHERE "agent" = ${safeAgent}
        ORDER BY embedding <=> ${vectorSql}::vector
        LIMIT ${k}
      `
    );

    return results;
  }

  clear(): void {
    this.inMemory.clear();
  }

  private composeKey(agent: string, key: string): string {
    return `${agent}:${key}`;
  }

  private normalizeVector(vector: number[]): number[] {
    if (!vector.length) {
      return new Array(this.dimension).fill(0);
    }
    if (vector.length === this.dimension) {
      return vector;
    }

    const normalized = new Array(this.dimension).fill(0);
    for (let i = 0; i < this.dimension; i++) {
      normalized[i] = vector[i % vector.length];
    }
    return normalized;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < this.dimension; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private vectorToSql(vector: number[]): Prisma.Sql {
    return Prisma.sql`[${Prisma.join(vector, ", ")}]`;
  }
}
