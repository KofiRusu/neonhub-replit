import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { AgentHandler, OrchestratorRequest, OrchestratorResponse } from "../types.js";
import { clearRegistry, registerAgent } from "../registry.js";
import { route } from "../router.js";
import { ensureOrchestratorBootstrap } from "../bootstrap.js";

jest.mock("../bootstrap.js", () => ({
  ensureOrchestratorBootstrap: jest.fn(async () => undefined),
}));

const bootstrapMock = ensureOrchestratorBootstrap as jest.MockedFunction<typeof ensureOrchestratorBootstrap>;

const buildRequest = (agent: OrchestratorRequest["agent"]): OrchestratorRequest => ({
  agent,
  intent: "test",
  payload: {},
  context: { userId: "test-user" },
});

describe("orchestrator router", () => {
  beforeEach(() => {
    clearRegistry();
    bootstrapMock.mockClear();
  });

  it("routes requests to registered agents", async () => {
    const handle = jest.fn(async (): Promise<OrchestratorResponse> => ({
      ok: true,
      data: { message: "ok" },
    }));

    const handler: AgentHandler = { handle };
    registerAgent("AdAgent", handler, { version: "test", capabilities: [] });

    const response = await route(buildRequest("AdAgent"));

    expect(response).toEqual({ ok: true, data: { message: "ok" } });
    expect(handle).toHaveBeenCalledTimes(1);
  });

  it("returns error when agent is not registered", async () => {
    const response = await route(buildRequest("SupportAgent"));
    expect(response.ok).toBe(false);
    expect(response).toMatchObject({ code: "AGENT_NOT_REGISTERED" });
  });

  it("retries failed handlers and succeeds on subsequent attempt", async () => {
    const handle = jest.fn(async (): Promise<OrchestratorResponse> => ({
      ok: true,
      data: { retried: true },
    }));
    handle.mockRejectedValueOnce(new Error("temporary"));

    const handler: AgentHandler = { handle };
    registerAgent("BrandVoiceAgent", handler, { version: "test", capabilities: [] });

    const response = await route(buildRequest("BrandVoiceAgent"));

    expect(response).toEqual({ ok: true, data: { retried: true } });
    expect(handle).toHaveBeenCalledTimes(2);
  });

  it("opens circuit after repeated failures", async () => {
    const failure = new Error("failure");
    const handle = jest.fn(async () => {
      throw failure;
    });

    const handler: AgentHandler = { handle };
    registerAgent("ContentAgent", handler, { version: "test", capabilities: [] });

    const failureResponse = await route(buildRequest("ContentAgent"));
    expect(failureResponse.ok).toBe(false);
    expect(failureResponse).toMatchObject({ code: "AGENT_EXECUTION_FAILED" });

    const circuitResponse = await route(buildRequest("ContentAgent"));
    expect(circuitResponse.ok).toBe(false);
    expect(circuitResponse).toMatchObject({ code: "CIRCUIT_OPEN" });
  });
});
