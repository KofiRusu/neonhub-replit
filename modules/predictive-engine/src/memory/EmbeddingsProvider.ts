import { createHash } from "crypto";

export interface EmbeddingsProvider {
  embed(text: string): Promise<number[]>;
}

class DeterministicEmbeddingsProvider implements EmbeddingsProvider {
  private readonly dimension: number;

  constructor(dimension = 1536) {
    this.dimension = dimension;
  }

  async embed(text: string): Promise<number[]> {
    const hash = createHash("sha256").update(text).digest();
    const vector: number[] = new Array(this.dimension);

    for (let i = 0; i < this.dimension; i++) {
      const byte = hash[i % hash.length];
      // Map byte (0-255) to range [-1, 1]
      vector[i] = (byte / 255) * 2 - 1;
    }

    return vector;
  }
}

export function createEmbeddingsProvider(): EmbeddingsProvider {
  const provider = (process.env.EMBEDDINGS_PROVIDER || "DETERMINISTIC").toUpperCase();

  if (process.env.TEST_MODE === "1") {
    return new DeterministicEmbeddingsProvider();
  }

  switch (provider) {
    case "OPENAI":
    case "ZAI":
    case "OLLAMA":
      // Placeholder for future network-backed providers. Today we fallback to deterministic
      // vectors to guarantee offline repeatability.
      return new DeterministicEmbeddingsProvider();
    default:
      return new DeterministicEmbeddingsProvider();
  }
}

export const defaultEmbeddingsProvider = createEmbeddingsProvider();
