import { Prisma, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../../db/prisma.js";
import { embedText } from "../../ai/embeddings.js";
import { toVectorSql } from "./vector-utils.js";

type StoreSnippetInput = {
  organizationId: string;
  personId: string;
  label?: string;
  text: string;
  category?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date | null;
  sourceEventId?: string;
};

type SearchMemoriesInput = {
  organizationId: string;
  query: string;
  limit?: number;
  personId?: string;
  category?: string;
};

export type MemorySnippet = {
  id: string;
  label: string | null;
  metadata: Prisma.JsonValue | null;
  similarity: number;
};

export class MemoryRagService {
  constructor(private readonly db: PrismaClient = defaultPrisma) {}

  async storeSnippet(input: StoreSnippetInput): Promise<void> {
    const embedding = await embedText(input.text);
    const record = await this.db.memEmbedding.create({
      data: {
        organizationId: input.organizationId,
        personId: input.personId,
        label: input.label ?? null,
        metadata: {
          ...(input.metadata ?? {}),
          ...(input.category ? { category: input.category } : {}),
        } as Prisma.JsonObject,
        expiresAt: input.expiresAt ?? undefined,
        sourceEventId: input.sourceEventId ?? undefined,
      },
    });

    const vectorLiteral = toVectorSql(embedding);
    await this.db.$executeRaw`
      UPDATE "mem_embeddings"
      SET "embedding" = ${vectorLiteral}
      WHERE id = ${record.id}
    `;
  }

  async searchSnippets(input: SearchMemoriesInput): Promise<MemorySnippet[]> {
    const embedding = await embedText(input.query);
    if (!embedding.length) {
      return [];
    }

    const filters: Prisma.Sql[] = [Prisma.sql`"organizationId" = ${input.organizationId}`];
    if (input.personId) {
      filters.push(Prisma.sql`"personId" = ${input.personId}`);
    }
    if (input.category) {
      filters.push(Prisma.sql`metadata ->> 'category' = ${input.category}`);
    }

    const whereClause = filters.length
      ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
      : Prisma.sql``;

    const vectorLiteral = toVectorSql(embedding);

    const query = Prisma.sql`
      SELECT id, label, metadata, 1 - (embedding <=> ${Prisma.raw(vectorLiteral)}) AS similarity
      FROM "mem_embeddings"
      ${whereClause}
      ORDER BY embedding <=> ${Prisma.raw(vectorLiteral)}
      LIMIT ${input.limit ?? 5}
    `;

    const rows = await this.db.$queryRaw<
      Array<{ id: string; label: string | null; metadata: Prisma.JsonValue | null; similarity: number }>
    >(query);

    return rows;
  }
}
