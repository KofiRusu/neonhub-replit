import { describe, expect, it } from "@jest/globals";
import { appRouter } from "../../router.js";

describe("agents.router", () => {
  it("exposes agents.execute mutation", () => {
    const agentsRouter = (appRouter as unknown as { agents: Record<string, unknown> }).agents;
    expect(agentsRouter).toBeDefined();
    expect((agentsRouter as Record<string, unknown>).execute).toBeDefined();
  });

  it("exposes agents.listRuns query", () => {
    const agentsRouter = (appRouter as unknown as { agents: Record<string, unknown> }).agents;
    expect((agentsRouter as Record<string, unknown>).listRuns).toBeDefined();
  });

  it("exposes agents.getRun query", () => {
    const agentsRouter = (appRouter as unknown as { agents: Record<string, unknown> }).agents;
    expect((agentsRouter as Record<string, unknown>).getRun).toBeDefined();
  });
});
