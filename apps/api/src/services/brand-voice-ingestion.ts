import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { openai } from "../lib/openai.js";
import { logger } from "../lib/logger.js";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const MAX_CHUNK_SIZE = 8000; // tokens (conservative for embeddings)

export interface BrandVoiceDocument {
  content: string;
  filename: string;
  mimeType: string;
}

export interface BrandVoiceMetadata {
  tone?: string[];
  vocabulary?: string[];
  doExamples?: string[];
  dontExamples?: string[];
  [key: string]: unknown;
}

export interface ParsedBrandVoice {
  summary: string;
  tone: string[];
  vocabulary: string[];
  doExamples: string[];
  dontExamples: string[];
  fullText: string;
}

/**
 * Parse brand voice document content into structured metadata
 */
export async function parseBrandVoiceDocument(content: string): Promise<ParsedBrandVoice> {
  logger.info("[brand-voice-ingestion] Parsing brand voice document");

  // Use OpenAI to extract structured information from the document
  const systemPrompt = `You are an expert at analyzing brand voice guidelines. Extract the following information from the provided brand voice document:

1. Tone descriptors (e.g., professional, friendly, witty, authoritative)
2. Key vocabulary terms that define the brand voice
3. DO examples (phrases or approaches to use)
4. DON'T examples (phrases or approaches to avoid)
5. A concise summary of the overall brand voice

Return the response as a JSON object with the following structure:
{
  "summary": "string",
  "tone": ["array", "of", "strings"],
  "vocabulary": ["array", "of", "key", "terms"],
  "doExamples": ["array", "of", "positive", "examples"],
  "dontExamples": ["array", "of", "negative", "examples"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Brand Voice Document:\n\n${content.slice(0, 12000)}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}");

    return {
      summary: parsed.summary ?? "Brand voice guidelines",
      tone: Array.isArray(parsed.tone) ? parsed.tone : [],
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
      doExamples: Array.isArray(parsed.doExamples) ? parsed.doExamples : [],
      dontExamples: Array.isArray(parsed.dontExamples) ? parsed.dontExamples : [],
      fullText: content,
    };
  } catch (error) {
    logger.error("[brand-voice-ingestion] Failed to parse document", error instanceof Error ? error.message : String(error));
    
    // Fallback: basic parsing
    return {
      summary: "Brand voice guidelines",
      tone: extractToneFromText(content),
      vocabulary: [],
      doExamples: [],
      dontExamples: [],
      fullText: content,
    };
  }
}

/**
 * Generate embedding vector for brand voice content
 */
export async function generateBrandVoiceEmbedding(text: string): Promise<number[]> {
  logger.info("[brand-voice-ingestion] Generating embedding");

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.slice(0, MAX_CHUNK_SIZE),
    });

    const embedding = response.data[0]?.embedding ?? [];
    
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}`);
    }

    return embedding;
  } catch (error) {
    logger.error("[brand-voice-ingestion] Failed to generate embedding", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Store brand voice guide in database with vector embedding
 */
export async function storeBrandVoice({
  brandId,
  organizationId,
  document,
  parsed,
}: {
  brandId: string;
  organizationId: string;
  document: BrandVoiceDocument;
  parsed: ParsedBrandVoice;
}): Promise<{ id: string; brandVoiceId: string }> {
  logger.info(`[brand-voice-ingestion] Storing brand voice for brand: ${brandId}`);

  // Generate embedding from summary + examples
  const embeddingText = [
    parsed.summary,
    ...parsed.doExamples.slice(0, 3),
    ...parsed.tone.slice(0, 5),
  ].join("\n");

  const embedding = await generateBrandVoiceEmbedding(embeddingText);

  // Store in BrandVoice table using actual schema fields
  const styleRulesJson: Prisma.JsonObject = {
    filename: document.filename,
    mimeType: document.mimeType,
    tone: parsed.tone,
    vocabulary: parsed.vocabulary,
    doExamples: parsed.doExamples,
    dontExamples: parsed.dontExamples,
    parsedAt: new Date().toISOString(),
  };

  // First, get or create an embedding space
  const embeddingSpace = await prisma.embeddingSpace.upsert({
    where: { 
      organizationId_name: {
        organizationId: organizationId,
        name: `brand-voice-${brandId}`,
      }
    },
    update: {},
    create: {
      name: `brand-voice-${brandId}`,
      organizationId: organizationId,
      provider: "openai",
      model: EMBEDDING_MODEL,
      dimension: 1536,
    },
  });

  const brandVoice = await prisma.brandVoice.create({
    data: {
      brandId,
      embeddingSpaceId: embeddingSpace.id,
      promptTemplate: parsed.summary,
      styleRulesJson,
      // Note: Embedding will be attached separately via raw SQL
      // due to Prisma's limited support for vector types
    },
  });

  // Attach vector embedding using raw SQL
  await prisma.$executeRaw`
    UPDATE "brand_voices"
    SET "embedding" = ${embedding}::vector
    WHERE id = ${brandVoice.id}
  `;

  logger.info(`[brand-voice-ingestion] Brand voice stored with ID: ${brandVoice.id}`);

  return {
    id: brandVoice.id,
    brandVoiceId: brandVoice.id,
  };
}

/**
 * Search for similar brand voice examples using vector similarity
 */
export async function searchSimilarBrandVoice({
  brandId,
  query,
  limit = 5,
}: {
  brandId: string;
  query: string;
  limit?: number;
}): Promise<
  Array<{
    id: string;
    summary: string;
    metadata: Prisma.JsonValue;
    similarity: number;
  }>
> {
  logger.info(`[brand-voice-ingestion] Searching similar brand voice for brand: ${brandId}, query: ${query.slice(0, 50)}`);

  // Generate embedding for query
  const queryEmbedding = await generateBrandVoiceEmbedding(query);

  // Use IVFFLAT index for similarity search (cosine distance)
  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      promptTemplate: string;
      styleRulesJson: Prisma.JsonValue;
      similarity: number;
    }>
  >`
    SELECT 
      id,
      "promptTemplate",
      "styleRulesJson",
      1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
    FROM "brand_voices"
    WHERE "brandId" = ${brandId}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `;

  // Map to expected return type
  return results.map((r) => ({
    id: r.id,
    summary: r.promptTemplate,
    metadata: r.styleRulesJson,
    similarity: r.similarity,
  }));
}

/**
 * Ingest brand voice document: parse, embed, and store
 */
export async function ingestBrandVoice({
  brandId,
  organizationId,
  document,
}: {
  brandId: string;
  organizationId: string;
  document: BrandVoiceDocument;
}): Promise<{ brandVoiceId: string; parsed: ParsedBrandVoice }> {
  logger.info(`[brand-voice-ingestion] Starting ingestion for brand: ${brandId}, file: ${document.filename}`);

  // Parse document
  const parsed = await parseBrandVoiceDocument(document.content);

  // Store with embedding
  const { brandVoiceId } = await storeBrandVoice({
    brandId,
    organizationId,
    document,
    parsed,
  });

  logger.info(`[brand-voice-ingestion] Ingestion complete, ID: ${brandVoiceId}`);

  return { brandVoiceId, parsed };
}

// Helper: Extract tone descriptors from text (fallback)
function extractToneFromText(text: string): string[] {
  const toneKeywords = [
    "professional",
    "friendly",
    "casual",
    "formal",
    "witty",
    "humorous",
    "authoritative",
    "conversational",
    "technical",
    "approachable",
    "confident",
    "empathetic",
  ];

  const lowerText = text.toLowerCase();
  return toneKeywords.filter((keyword) => lowerText.includes(keyword));
}

/**
 * List all brand voice guides for a brand
 */
export async function listBrandVoiceGuides(
  brandId: string
): Promise<
  Array<{
    id: string;
    summary: string;
    metadata: Prisma.JsonValue;
    createdAt: Date;
  }>
> {
  const voices = await prisma.brandVoice.findMany({
    where: { brandId },
    select: {
      id: true,
      promptTemplate: true,
      styleRulesJson: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Map to expected return type
  return voices.map((v) => ({
    id: v.id,
    summary: v.promptTemplate,
    metadata: v.styleRulesJson,
    createdAt: v.createdAt,
  }));
}

/**
 * Delete brand voice guide
 */
export async function deleteBrandVoiceGuide(id: string): Promise<void> {
  await prisma.brandVoice.delete({
    where: { id },
  });

  logger.info(`[brand-voice-ingestion] Brand voice deleted, ID: ${id}`);
}
