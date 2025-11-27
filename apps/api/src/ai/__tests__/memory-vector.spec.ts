import { embed, search } from "../memory/vector";

describe("ai memory vector helpers", () => {
  it("produces deterministic embeddings within [0, 1]", async () => {
    const first = await embed("NeonHub launch");
    const second = await embed("NeonHub launch");

    expect(first).toEqual(second);
    first.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThan(1.01);
    });
  });

  it("returns the requested number of search results with descending scores", async () => {
    const defaultResults = await search("roadmap");
    expect(defaultResults).toHaveLength(3);

    const customResults = await search("roadmap", 4);
    expect(customResults).toHaveLength(4);
    expect(customResults[0].score).toBeGreaterThan(customResults[1].score);
    expect(customResults[3].id).toBe("doc_3");
  });
});
