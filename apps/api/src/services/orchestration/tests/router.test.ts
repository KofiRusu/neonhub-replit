import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.mock("../bootstrap.js", () => ({
  ensureOrchestratorBootstrap: jest.fn().mockResolvedValue(undefined)
}));

import type { OrchestratorResponse } from "../types.js";
import { route } from "../router.js";
import { registerAgent, clearRegistry } from "../registry.js";
import { ensureOrchestratorBootstrap } from "../bootstrap.js";

const bootstrapMock = ensureOrchestratorBootstrap as jest.Mock;

const baseRequest = {
  intent: "test",
  payload: {},
  context: { userId: "test-user" }
};

describe("orchestrator router", () => {
  beforeEach(() => {
    clearRegistry();
    bootstrapMock.mockClear();
  });

  it("routes requests to registered agents", async () => {
    const handler = jest.fn(async () => ({ ok: true, data: { message: "ok" } } satisfies OrchestratorResponse));
    registerAgent("AdAgent", { handle: handler }, { version: "test", capabilities: [] });

    const response = await route({ agent: "AdAgent", ...baseRequest });

    expect(response).toEqual({ ok: true, data: { message: "ok" } });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("returns error when agent is not registered", async () => {
    const response = await route({ agent: "SupportAgent", ...baseRequest });
    expect(response.ok).toBe(false);
    expect(response).toMatchObject({ code: "AGENT_NOT_REGISTERED" });
  });

  it("retries failed handlers and succeeds on subsequent attempt", async () => {
    const handler = jest
      .fn()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValue({ ok: true, data: { retried: true } } satisfies OrchestratorResponse);

    registerAgent("AdAgent", { handle: handler }, { version: "test", capabilities: [] });

    const response = await route({ agent: "AdAgent", ...baseRequest });

    expect(response).toEqual({ ok: true, data: { retried: true } });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("opens circuit after repeated failures", async () => {
    const handler = jest.fn(async () => {
      throw new Error("failure");
    });

    registerAgent("AdAgent", { handle: handler }, { version: "test", capabilities: [] });

    // First three attempts increment failure count
    for (let i = 0; i < 3; i++) {
      const response = await route({ agent: "AdAgent", ...baseRequest });
      expect(response.ok).toBe(false);
      expect(response.code).toBe("AGENT_EXECUTION_FAILED");
    }

    const circuitResponse = await route({ agent: "AdAgent", ...baseRequest });
    expect(circuitResponse.ok).toBe(false);
    expect(circuitResponse.code).toBe("CIRCUIT_OPEN");
  });
});
