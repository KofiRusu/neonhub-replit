import { describe, beforeEach, it, expect } from "@jest/globals";
import { getAgent } from "../registry.js";
import { registerDefaultAgents, resetRegisteredAgentsForTest } from "../register-agents.js";

describe("registerDefaultAgents", () => {
  beforeEach(() => {
    resetRegisteredAgentsForTest();
  });

  it("registers orchestrator-ready agents exactly once", () => {
    registerDefaultAgents();
    registerDefaultAgents(); // idempotent

    const contentAgent = getAgent("ContentAgent");
    const emailAgent = getAgent("EmailAgent");

    expect(contentAgent).toBeDefined();
    expect(emailAgent).toBeDefined();
    expect(contentAgent?.capabilities).toEqual(
      expect.arrayContaining(["generate-draft"]),
    );
  });
});
