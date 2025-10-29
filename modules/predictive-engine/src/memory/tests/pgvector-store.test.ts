import { describe, it, beforeEach, expect } from "@jest/globals";
import { PgVectorStore } from "../PgVectorStore.js";
import { createEmbeddingsProvider } from "../EmbeddingsProvider.js";

const embeddings = createEmbeddingsProvider();

describe("PgVectorStore", () => {
  let store: PgVectorStore;

  beforeEach(() => {
    store = new PgVectorStore(null, embeddings, 16);
    store.clear();
  });

  it("persists and recalls memories in test mode", async () => {
    await store.upsert("AdAgent", "welcome", "Welcome to the orchestrator test harness");
    await store.upsert("AdAgent", "autoscale", "Auto scaling keeps latency low");

    const results = await store.query("AdAgent", "welcome", 5);

    expect(results).toHaveLength(2);
    expect(results[0].key).toBe("welcome");
    expect(results[0].similarity).toBeGreaterThanOrEqual(results[1].similarity);
  });

  it("respects the requested limit", async () => {
    await store.upsert("AdAgent", "entry1", "First memory entry");
    await store.upsert("AdAgent", "entry2", "Second memory entry");
    await store.upsert("AdAgent", "entry3", "Third memory entry");

    const results = await store.query("AdAgent", "memory entry", 2);
    expect(results).toHaveLength(2);
  });

  it("returns empty results after clearing", async () => {
    await store.upsert("AdAgent", "to-clear", "This will be removed");
    store.clear();

    const results = await store.query("AdAgent", "removed", 5);
    expect(results).toHaveLength(0);
  });
});
