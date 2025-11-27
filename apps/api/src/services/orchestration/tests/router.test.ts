import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { AgentHandler, OrchestratorRequest, OrchestratorResponse } from "../types.js";
import { clearRegistry, registerAgent } from "../registry.js";
import { route, __resetOrchestratorState } from "../router.js";
import { ensureOrchestratorBootstrap } from "../bootstrap.js";

jest.mock("../bootstrap.js", () => ({
  ensureOrchestratorBootstrap: jest.fn(async () => undefined),
}));

const bootstrapMock = ensureOrchestratorBootstrap as jest.MockedFunction<typeof ensureOrchestratorBootstrap>;

const buildRequest = (overrides: Partial<OrchestratorRequest> = {}): OrchestratorRequest => ({
  agent: "AdAgent",
  intent: "test",
  payload: {},
  context: { userId: "test-user" },
  ...overrides,
});

describe("orchestrator router", () => {
  beforeEach(() => {
    clearRegistry();
    bootstrapMock.mockClear();
    __resetOrchestratorState();
  });

  it("routes requests to registered agents", async () => {
    const handle = jest.fn(async (): Promise<OrchestratorResponse> => ({
      ok: true,
      data: { message: "ok" },
    }));

    const handler: AgentHandler = { handle };
    registerAgent("AdAgent", handler, { version: "test", capabilities: [] });

    const response = await route(buildRequest({ agent: "AdAgent" }));

    expect(response).toMatchObject({
      ok: true,
      data: { message: "ok" },
      meta: { agent: "AdAgent", intent: "test" },
    });
    expect(handle).toHaveBeenCalledTimes(1);
  });

  it("returns error when agent is not registered", async () => {
    const response = await route(buildRequest({ agent: "SupportAgent" }));
    expect(response.ok).toBe(false);
    expect(response).toMatchObject({
      ok: false,
      code: "AGENT_NOT_REGISTERED",
      meta: { agent: "SupportAgent", intent: "test" },
    });
  });

  it("retries failed handlers and succeeds on subsequent attempt", async () => {
    const handle = jest.fn(async (): Promise<OrchestratorResponse> => ({
      ok: true,
      data: { retried: true },
    }));
    handle.mockRejectedValueOnce(new Error("temporary"));

    const handler: AgentHandler = { handle };
    registerAgent("BrandVoiceAgent", handler, { version: "test", capabilities: [] });

    const response = await route(buildRequest({ agent: "BrandVoiceAgent" }));

    expect(response).toMatchObject({
      ok: true,
      data: { retried: true },
      meta: { agent: "BrandVoiceAgent", intent: "test" },
    });
    expect(handle).toHaveBeenCalledTimes(2);
  });

  it("opens circuit after repeated failures", async () => {
    const failure = new Error("failure");
    const handle = jest.fn(async () => {
      throw failure;
    });

    const handler: AgentHandler = { handle };
    registerAgent("ContentAgent", handler, { version: "test", capabilities: [] });

    const failureResponse = await route(buildRequest({ agent: "ContentAgent" }));
    expect(failureResponse.ok).toBe(false);
    expect(failureResponse).toMatchObject({
      ok: false,
      code: "AGENT_EXECUTION_FAILED",
      meta: { agent: "ContentAgent", intent: "test" },
    });

    const circuitResponse = await route(buildRequest({ agent: "ContentAgent" }));
    expect(circuitResponse.ok).toBe(false);
    expect(circuitResponse).toMatchObject({
      ok: false,
      code: "CIRCUIT_OPEN",
      meta: { agent: "ContentAgent", intent: "test" },
    });
  });

  it("resolves agent automatically for known intents when omitted", async () => {
    const handle = jest.fn(async (request: OrchestratorRequest): Promise<OrchestratorResponse> => {
      return { ok: true, data: { intent: request.intent, agent: request.agent } };
    });

    registerAgent("ContentAgent", { handle }, { version: "test", capabilities: [] });

    const response = await route(buildRequest({ agent: undefined, intent: "generate-draft" }));
    expect(response).toMatchObject({
      ok: true,
      data: { intent: "generate-draft" },
      meta: { agent: "ContentAgent", intent: "generate-draft" },
    });
    expect(handle).toHaveBeenCalledTimes(1);
    expect(handle).toHaveBeenCalledWith(
      expect.objectContaining({ agent: "ContentAgent", intent: "generate-draft" }),
    );
  });

  it("rejects requests when intent agent mapping mismatches", async () => {
    registerAgent("EmailAgent", { handle: async () => ({ ok: true, data: {} }) }, { version: "test", capabilities: [] });

    const response = await route(buildRequest({ agent: "SocialAgent", intent: "generate-sequence" }));
    expect(response.ok).toBe(false);
    expect(response).toMatchObject({ code: "INTENT_AGENT_MISMATCH" });
  });

  it("requires agent when intent is unknown", async () => {
    const response = await route(buildRequest({ agent: undefined, intent: "totally-unknown" }));
    expect(response.ok).toBe(false);
    expect(response).toMatchObject({ code: "AGENT_REQUIRED" });
  });
});
