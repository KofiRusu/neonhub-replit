import { describe, expect, it } from "@jest/globals";
import type { PgVectorStore } from "@neonhub/predictive-engine";
import { seedAgentMemories } from "../../../scripts/seed-agent-memory";

class FakeVectorStore implements Pick<PgVectorStore, "upsert"> {
  private readonly data = new Map<string, { agent: string; key: string; content: string }>();

  async upsert(agent: string, key: string, content: string): Promise<void> {
    this.data.set(`${agent}:${key}`, { agent, key, content });
  }

  async query(agent: string, _query: string, k = 5) {
    return Array.from(this.data.values())
      .filter((record) => record.agent === agent)
      .slice(0, k)
      .map((record) => ({
        key: record.key,
        content: record.content,
        similarity: 1,
      }));
  }
}

describe("seed-agent-memory script", () => {
  it("seeds memories without hitting the database in test mode", async () => {
    const prismaMock = {
      $executeRawUnsafe: jest.fn(),
    };
    const vectorStore = new FakeVectorStore();

    const result = await seedAgentMemories({
      prismaClient: prismaMock as never,
      vectorStore: vectorStore as unknown as PgVectorStore,
      testMode: true,
      log: false,
      items: [
        { agent: "TestAgent", key: "welcome", content: "Welcome to NeonHub!" },
        { agent: "TestAgent", key: "cta", content: "Book a demo today." },
      ],
    });

    expect(result.seeded).toBe(2);
    expect(result.testMode).toBe(true);
    expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();

    const queryResults = await vectorStore.query("TestAgent", "demo", 2);
    expect(queryResults).toHaveLength(2);
    expect(queryResults[0].content).toContain("NeonHub");
  });
});
