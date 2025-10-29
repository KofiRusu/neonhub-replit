import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../db/prisma.js";
import { openai } from "../lib/openai.js";

const EMBEDDING_MODEL = "text-embedding-3-small";
const ANCHOR_MODEL = "gpt-4o-mini";
const EMBEDDING_SLICE_LIMIT = 6000;

export interface InternalLinkSuggestion {
  targetContentId: string;
  title: string | null;
  similarity: number;
  anchorText: string;
  reason: string;
}

type SuggestInternalLinksArgs = {
  contentId: string;
  content: string;
  limit?: number;
  prisma?: PrismaClient;
};

type TrackLinkGraphArgs = {
  sourceContentId: string;
  targetContentId: string;
  anchorText: string;
  similarity?: number;
  prisma?: PrismaClient;
};

const buildVectorLiteral = (vector: number[]) =>
  Prisma.sql`ARRAY[${Prisma.join(vector.map((value) => Prisma.sql`${value}`))}]::vector`;

async function createEmbedding(text: string): Promise<number[]> {
  const payload = text.length > EMBEDDING_SLICE_LIMIT ? text.slice(0, EMBEDDING_SLICE_LIMIT) : text;
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: payload,
  });
  const embedding = response.data?.[0]?.embedding ?? [];
  if (!embedding.length) {
    throw new Error("Failed to generate embedding for internal linking");
  }
  return embedding;
}

async function resolveContentContext(prisma: PrismaClient, contentId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { id: true, organizationId: true, status: true },
  });
  if (!content) {
    throw new Error(`Content ${contentId} not found`);
  }
  return content;
}

async function mapDocumentsToContent(prisma: PrismaClient, organizationId: string, documentIds: string[]) {
  if (!documentIds.length) {
    return new Map<string, { id: string; title: string | null }>();
  }
  const contentRecords = await prisma.content.findMany({
    where: {
      organizationId,
      OR: documentIds.map((documentId) => ({
        metadata: {
          path: ["documentId"],
          equals: documentId,
        },
      })),
    },
    select: { id: true, title: true, metadata: true },
  });

  const matched = new Map<string, { id: string; title: string | null }>();
  for (const record of contentRecords) {
    const metadata = record.metadata as Record<string, unknown> | null;
    const documentId = typeof metadata?.documentId === "string" ? metadata.documentId : null;
    if (documentId) {
      matched.set(documentId, { id: record.id, title: record.title ?? null });
    }
  }
  return matched;
}

export async function suggestInternalLinks({
  contentId,
  content,
  limit = 5,
  prisma = defaultPrisma,
}: SuggestInternalLinksArgs): Promise<InternalLinkSuggestion[]> {
  if (limit <= 0) {
    return [];
  }
  const { organizationId } = await resolveContentContext(prisma, contentId);
  const embedding = await createEmbedding(content);
  const vectorLiteral = buildVectorLiteral(embedding);

  const relatedDocuments = await prisma.$queryRaw<
    Array<{ targetDocumentId: string; title: string | null; distance: number | null }>
  >`
    SELECT
      d.id AS "targetDocumentId",
      d.title,
      MIN(ch.embedding <=> ${vectorLiteral}) AS distance
    FROM "chunks" ch
    JOIN "documents" d ON d.id = ch."documentId"
    WHERE d."organizationId" = ${organizationId}
      AND d.id <> (
        SELECT COALESCE(
          (metadata ->> 'documentId'),
          ''
        )
        FROM "content"
        WHERE id = ${contentId}
      )
      AND (d.status IS NULL OR d.status = 'published')
    GROUP BY d.id, d.title
    ORDER BY distance
    LIMIT ${limit}
  `;

  if (!relatedDocuments.length) {
    return [];
  }

  const documentIds = relatedDocuments.map((row) => row.targetDocumentId);
  const contentMapping = await mapDocumentsToContent(prisma, organizationId, documentIds);

  const suggestions: InternalLinkSuggestion[] = [];
  for (const row of relatedDocuments) {
    const mapping = contentMapping.get(row.targetDocumentId);
    const targetContentId = mapping?.id ?? row.targetDocumentId;
    if (targetContentId === contentId) {
      continue;
    }

    const distance = typeof row.distance === "number" ? row.distance : 1;
    const similarity = Math.max(0, Math.min(1, 1 - distance));
    const anchorText = await generateAnchorText({
      sourceContent: content,
      targetTitle: mapping?.title ?? row.title ?? "Related article",
      keyword: mapping?.title ?? row.title ?? "related insights",
    });

    suggestions.push({
      targetContentId,
      title: mapping?.title ?? row.title ?? null,
      similarity: Number(similarity.toFixed(4)),
      anchorText,
      reason: `Semantic similarity score ${similarity.toFixed(2)}`,
    });
  }

  return suggestions.slice(0, limit);
}

export async function generateAnchorText({
  sourceContent,
  targetTitle,
  keyword,
}: {
  sourceContent: string;
  targetTitle: string;
  keyword: string;
}): Promise<string> {
  const prompt = [
    "Generate natural anchor text for an internal link.",
    `Source content: ${sourceContent.slice(0, 400)}`,
    `Target title: ${targetTitle}`,
    `Preferred keyword: ${keyword}`,
    "Anchor text must be 3-5 words, descriptive, and avoid generic phrases.",
    "Respond with anchor text only.",
  ].join("\n\n");

  try {
    const completion = await openai.chat.completions.create({
      model: ANCHOR_MODEL,
      messages: [
        {
          role: "system",
          content: "You craft concise, descriptive internal link anchor text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 40,
    });
    const candidate = completion.choices?.[0]?.message?.content?.trim();
    if (candidate && candidate.split(/\s+/).length >= 3 && candidate.split(/\s+/).length <= 5) {
      return candidate.replace(/[".]/g, "").trim();
    }
  } catch (error) {
    // fall through to fallback
  }

  const fallback = keyword || targetTitle;
  return fallback.split(/\s+/).slice(0, 5).join(" ");
}

export async function trackLinkGraph({
  sourceContentId,
  targetContentId,
  anchorText,
  similarity,
  prisma = defaultPrisma,
}: TrackLinkGraphArgs) {
  if (sourceContentId === targetContentId) {
    throw new Error("Cannot track self-referential links");
  }

  const source = await prisma.content.findUnique({
    where: { id: sourceContentId },
    select: { id: true, organizationId: true },
  });
  const target = await prisma.content.findUnique({
    where: { id: targetContentId },
    select: { id: true },
  });

  if (!source || !target) {
    throw new Error("Source or target content not found for link graph tracking");
  }

  return prisma.linkGraph.upsert({
    where: {
      sourceContentId_targetContentId_anchorText: {
        sourceContentId: sourceContentId,
        targetContentId: targetContentId,
        anchorText,
      },
    },
    update: {
      similarity,
    },
    create: {
      organizationId: source.organizationId,
      sourceContentId,
      targetContentId,
      anchorText,
      similarity,
    },
  });
}
