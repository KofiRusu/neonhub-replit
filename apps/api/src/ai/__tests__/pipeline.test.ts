import { runPipeline } from "../workflows/pipeline";

jest.mock("../memory/docs", () => ({ recent: () => [] }));

describe("pipeline", () => {
  it("runs end-to-end deterministically", async () => {
    const result = await runPipeline({ objective: "Test pipeline", channel: "blog" });
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.score.total).toBeGreaterThan(0);
    expect(result.verify.ok).toBe(true);
  });
});
