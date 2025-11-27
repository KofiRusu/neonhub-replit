import { describe, expect, it, jest } from "@jest/globals";

describe("ai scoring reward tracker", () => {
  const loadModule = async () => {
    jest.resetModules();
    return await import("../scoring/reward");
  };

  it("returns zeroed reward for unknown agents", async () => {
    const { getReward } = await loadModule();
    expect(getReward("unseen-agent")).toEqual({ average: 0, count: 0 });
  });

  it("accumulates rewards and updates averages", async () => {
    const { recordReward, getReward } = await loadModule();

    const first = recordReward("copy-agent", 0.9);
    expect(first).toEqual({ average: 0.9, count: 1 });

    const second = recordReward("copy-agent", 0.3);
    expect(second).toEqual({ average: 0.6, count: 2 });

    const snapshot = getReward("copy-agent");
    expect(snapshot.average).toBeCloseTo(0.6);
    expect(snapshot.count).toBe(2);
  });

  it("supports negative rewards without breaking averages", async () => {
    const { recordReward, getReward } = await loadModule();

    recordReward("seo-agent", 1);
    recordReward("seo-agent", -0.5);

    const snapshot = getReward("seo-agent");
    expect(snapshot.count).toBe(2);
    expect(snapshot.average).toBeCloseTo(0.25);
  });
});
