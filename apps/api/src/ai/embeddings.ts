import { openai, isOpenAIConfigured } from "../lib/openai.js";
import { logger } from "../lib/logger.js";

const DEFAULT_MODEL = "text-embedding-3-small";
const DEFAULT_DIMENSION = 1536;

function deterministicEmbedding(text: string, dimension = DEFAULT_DIMENSION): number[] {
  const output = new Array<number>(dimension);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  for (let i = 0; i < dimension; i += 1) {
    const value = Math.sin(hash + i * 13);
    output[i] = Number(value.toFixed(6));
  }
  return output;
}

export async function embedText(text: string, options?: { model?: string }): Promise<number[]> {
  const normalized = text?.trim() ?? "";
  if (!normalized) {
    return deterministicEmbedding("empty");
  }

  const model = options?.model ?? DEFAULT_MODEL;

  if (!isOpenAIConfigured) {
    return deterministicEmbedding(normalized);
  }

  try {
    const response = await openai.embeddings.create({
      model,
      input: normalized,
    });

    const embedding = response.data?.[0]?.embedding;
    if (embedding && embedding.length) {
      return embedding;
    }
  } catch (error) {
    logger.warn({ error }, "Embedding request failed; falling back to deterministic vector");
  }

  return deterministicEmbedding(normalized);
}
