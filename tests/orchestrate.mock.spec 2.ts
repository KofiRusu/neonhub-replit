import { describe, it, expect, beforeEach, afterAll, jest } from "@jest/globals";
import { createRequire } from "module";
import type { OrchestratorRequest } from "../apps/api/src/services/orchestration/types.js";

// Force deterministic mock mode so no live services are required
process.env.NODE_ENV = "test";
process.env.USE_MOCK_CONNECTORS = "true";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://****:****@host:5432/neonhub";
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret-min-32-chars-long-1234567890";
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || "http://localhost:3000";
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock";
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "test-resend";
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "test-openai";
process.env.OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
process.env.BETA_ENABLED = process.env.BETA_ENABLED || "false";
process.env.PORT = process.env.PORT || "4110";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const require = createRequire(import.meta.url);
const { mockPrismaClient, resetMockData } = require("../apps/api/src/__mocks__/prisma.ts");

// Prevent the orchestrator bootstrap from pulling heavy deps during tests
jest.unstable_mockModule("../apps/api/src/services/orchestration/bootstrap.js", () => ({
  ensureOrchestratorBootstrap: jest.fn().mockResolvedValue(undefined),
}));

// Ensure all Prisma access inside orchestrator router hits the mock client
jest.unstable_mockModule("../apps/api/src/db/prisma.js", () => ({
  prisma: mockPrismaClient,
}));

const [{ route }, { registerAgent, clearRegistry }, { ConnectorFactory }] = await Promise.all([
  import("../apps/api/src/services/orchestration/router.js"),
  import("../apps/api/src/services/orchestration/registry.js"),
  import("../apps/api/src/connectors/factory.js"),
]);

describe("Mocked orchestrator persistence", () => {
  beforeEach(() => {
    resetMockData();
    clearRegistry();
    jest.clearAllMocks();
  });

  afterAll(() => {
    clearRegistry();
  });

  it("persists AgentRun rows when mocks are enabled", async () => {
    registerAgent("ContentAgent", {
      handle: async (req: OrchestratorRequest) => {
        const gmail = ConnectorFactory.create("gmail");
        const message = await gmail.send({
          to: "ops@example.com",
          subject: "Mock orchestrator run",
          body: JSON.stringify(req.payload),
        });

        return {
          ok: true,
          data: {
            connector: "gmail",
            mockMessageId: message.id,
          },
        };
      },
    });

    const request: OrchestratorRequest = {
      agent: "ContentAgent",
      intent: "kt-smoke",
      payload: { subject: "KT bundle", persona: "Creator Pro" },
      context: {
        organizationId: "test-org-id",
        userId: "test-user-id",
      },
    };

    const response = await route(request);

    expect(response.ok).toBe(true);
    if (!response.ok) {
      throw new Error("Orchestrator response unexpectedly failed");
    }

    const runs = await mockPrismaClient.agentRun.findMany({});
    expect(runs).toHaveLength(1);

    const [run] = runs;
    expect(run.status).toBe("completed");
    expect(run.input).toMatchObject({ subject: "KT bundle" });
    expect(run.metrics).toMatchObject({
      intent: "kt-smoke",
      responseOk: true,
    });

    expect(mockPrismaClient.agentRun.create).toHaveBeenCalledTimes(1);
    expect(mockPrismaClient.agentRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: run.id },
        data: expect.objectContaining({ status: "completed" }),
      }),
    );
  });
});
