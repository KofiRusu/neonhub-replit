import { Prisma, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../../db/prisma.js";
import { embedText } from "../../ai/embeddings.js";
import { toVectorSql } from "./vector-utils.js";

const DEFAULT_EMBEDDING_SPACE_NAME = "org-rag-space";

function chunkText(input: string, chunkSize = 600): string[] {
  const normalized = input.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= chunkSize) {
      chunks.push(paragraph);
      continue;
    }
    for (let i = 0; i < paragraph.length; i += chunkSize) {
      chunks.push(paragraph.slice(i, i + chunkSize));
    }
  }

  return chunks;
}

type IngestSnippetInput = {
  organizationId: string;
  datasetSlug: string;
  datasetName: string;
  title: string;
  content: string;
  ownerId: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
};

type RetrieveSnippetInput = {
  organizationId: string;
  datasetSlug: string;
  query: string;
  limit?: number;
};

export type KnowledgeSnippet = {
  id: string;
  text: string;
  title: string;
  metadata: Prisma.JsonValue | null;
  similarity: number;
};

export class KnowledgeBaseService {
  constructor(private readonly db: PrismaClient = defaultPrisma) {}

  private async ensureEmbeddingSpace(organizationId: string): Promise<string> {
    const existing = await this.db.embeddingSpace.findFirst({
      where: { organizationId, name: DEFAULT_EMBEDDING_SPACE_NAME },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await this.db.embeddingSpace.create({
      data: {
        organizationId,
        name: DEFAULT_EMBEDDING_SPACE_NAME,
        provider: "openai",
        model: "text-embedding-3-small",
        dimension: 1536,
      },
    });
    return created.id;
  }

  private async ensureDataset(organizationId: string, slug: string, name: string, embeddingSpaceId: string) {
    const existing = await this.db.dataset.findFirst({
      where: { organizationId, slug },
      select: { id: true, embeddingSpaceId: true },
    });
    if (existing) {
      if (!existing.embeddingSpaceId) {
        await this.db.dataset.update({
          where: { id: existing.id },
          data: { embeddingSpaceId },
        });
      }
      return existing.id;
    }

    const created = await this.db.dataset.create({
      data: {
        organization: { connect: { id: organizationId } },
        slug,
        name,
        kind: "documents",
        embeddingSpace: { connect: { id: embeddingSpaceId } },
      },
    });
    return created.id;
  }

  async ingestSnippet(input: IngestSnippetInput): Promise<void> {
    const chunks = chunkText(input.content);
    if (!chunks.length) return;

    const embeddingSpaceId = await this.ensureEmbeddingSpace(input.organizationId);
    const datasetId = await this.ensureDataset(input.organizationId, input.datasetSlug, input.datasetName, embeddingSpaceId);

    const document = await this.db.document.create({
      data: {
        datasetId,
        organizationId: input.organizationId,
        ownerId: input.ownerId,
        title: input.title,
        content: input.content,
        status: "published",
        embeddingSpaceId,
        metadata: {
          ...(input.metadata ?? {}),
          tags: input.tags ?? [],
        } as Prisma.JsonObject,
      },
    });

    let index = 0;
    for (const chunk of chunks) {
      const embedding = await embedText(chunk);
      const record = await this.db.chunk.create({
        data: {
          datasetId,
          documentId: document.id,
          embeddingSpaceId,
          idx: index,
          text: chunk,
          metadata: {
            ...(input.metadata ?? {}),
            tags: input.tags ?? [],
          } as Prisma.JsonObject,
        },
      });

      const vectorLiteral = toVectorSql(embedding);
      await this.db.$executeRaw`
        UPDATE "chunks"
        SET "embedding" = ${vectorLiteral}
        WHERE id = ${record.id}
      `;

      index += 1;
    }
  }

  async retrieveSnippets(input: RetrieveSnippetInput): Promise<KnowledgeSnippet[]> {
    const dataset = await this.db.dataset.findFirst({
      where: {
        organizationId: input.organizationId,
        slug: input.datasetSlug,
      },
      select: { id: true },
    });

    if (!dataset) {
      return [];
    }

    const embedding = await embedText(input.query);
    if (!embedding.length) {
      return [];
    }

    const vectorLiteral = toVectorSql(embedding);

    const rows = await this.db.$queryRaw<Array<{ id: string; text: string; metadata: Prisma.JsonValue | null; similarity: number; title: string }>>`
      SELECT c.id, c.text, c.metadata, d.title, 1 - (c.embedding <=> ${vectorLiteral}) AS similarity
      FROM "chunks" c
      JOIN "documents" d ON d.id = c."documentId"
      WHERE c."datasetId" = ${dataset.id}
      ORDER BY c.embedding <=> ${vectorLiteral}
      LIMIT ${input.limit ?? 5}
    `;

    return rows.map((row) => ({
      id: row.id,
      text: row.text,
      metadata: row.metadata,
      similarity: row.similarity,
      title: row.title,
    }));
  }
}
