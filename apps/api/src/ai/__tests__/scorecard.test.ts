import { computeScorecard } from "../scoring/scorecard";

describe("scorecard", () => {
  it("computes weighted score", () => {
    const result = computeScorecard("Short content");
    expect(result.total).toBeGreaterThan(0);
    expect(result.breakdown.readability).toBeLessThanOrEqual(1);
  });
});
