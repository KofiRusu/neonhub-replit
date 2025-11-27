import { describe, expect, it } from "@jest/globals";
import { estimateCostUSD } from "../utils/cost";

describe("estimateCostUSD", () => {
  it("computes cost for known models", () => {
    const total = estimateCostUSD("gpt-4o", 2000, 1000);
    expect(total).toBeCloseTo(25, 6);
  });

  it("falls back to mini model when unknown", () => {
    const unknown = estimateCostUSD("custom-model", 500, 500);
    const fallback = estimateCostUSD("gpt-4o-mini", 500, 500);
    expect(unknown).toBe(fallback);
  });

  it("handles missing token values gracefully", () => {
    expect(estimateCostUSD("gpt-4o-mini", 0, 0)).toBe(0);
    expect(estimateCostUSD("gpt-4o-mini", NaN, NaN)).toBe(0);
  });

  it("clamps negative token counts to zero", () => {
    const total = estimateCostUSD("gpt-4o", -100, -250);
    expect(total).toBe(0);
  });

  it("supports large token volumes without precision loss", () => {
    const total = estimateCostUSD("gpt-4o", 1_000_000, 2_000_000);
    const expected = (1_000_000 / 1000) * 5 + (2_000_000 / 1000) * 15;
    expect(total).toBeCloseTo(expected, 6);
  });
});
