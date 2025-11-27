import pino from 'pino';
import { EmbeddingProvider } from './types.js';

const logger = pino({ name: 'embedding-provider' });

/**
 * Simple embedding provider adapter
 * In production, integrate with @neonhub/llm-adapter
 */
export class SimpleEmbeddingProvider implements EmbeddingProvider {
  dimension = 1536; // OpenAI ada-002 dimension

  constructor(
    private embedFn: (texts: string[]) => Promise<number[][]>,
    private embeddingDim = 1536
  ) {
    this.dimension = embeddingDim;
  }

  async embed(texts: string[]): Promise<number[][]> {
    logger.info({ count: texts.length }, 'Generating embeddings');

    try {
      const embeddings = await this.embedFn(texts);
      
      logger.info({ count: embeddings.length, dimension: this.dimension }, 'Embeddings generated');
      return embeddings;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to generate embeddings');
      throw error;
    }
  }
}

/**
 * Mock embedding provider for testing
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  dimension = 384; // Smaller dimension for mock

  async embed(texts: string[]): Promise<number[][]> {
    logger.info({ count: texts.length }, 'Generating mock embeddings');

    // Generate random embeddings for testing
    return texts.map(() =>
      Array.from({ length: this.dimension }, () => Math.random() * 2 - 1)
    );
  }
}

/**
 * Helper to calculate cosine similarity
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Helper to find top K most similar vectors
 */
export function findTopK(
  query: number[],
  vectors: Array<{ vector: number[]; data: any }>,
  k: number
): Array<{ similarity: number; data: any }> {
  const similarities = vectors.map((item) => ({
    similarity: cosineSimilarity(query, item.vector),
    data: item.data,
  }));

  // Sort by similarity descending
  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, k);
}

