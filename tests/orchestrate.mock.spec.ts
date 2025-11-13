import { describe, it, expect, beforeAll, beforeEach, afterAll, jest } from "@jest/globals";
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

type RouterModule = typeof import("../apps/api/src/services/orchestration/router.js");
type RegistryModule = typeof import("../apps/api/src/services/orchestration/registry.js");
type ConnectorModule = typeof import("../apps/api/src/connectors/factory.js");

let route: RouterModule["route"];
let registerAgent: RegistryModule["registerAgent"];
let clearRegistry: RegistryModule["clearRegistry"];
let ConnectorFactory: ConnectorModule["ConnectorFactory"];
let mockPrismaClient: any;
let resetMockData: () => void;

beforeAll(async () => {
  const prismaMockModule: any = await import("../apps/api/src/__mocks__/prisma.js");
  const mockSource = prismaMockModule.default ?? prismaMockModule;
  mockPrismaClient = mockSource.mockPrismaClient || mockSource.prisma;
  resetMockData = mockSource.resetMockData;
  (globalThis as Record<string, unknown>).prisma = mockPrismaClient;

  const noopBootstrap = jest.fn(async () => undefined);

  jest.unstable_mockModule("../apps/api/src/services/orchestration/bootstrap.js", () => ({
    ensureOrchestratorBootstrap: noopBootstrap,
  }));

  jest.unstable_mockModule("../apps/api/src/db/prisma.js", () => ({
    prisma: mockPrismaClient,
  }));

  ({ route } = await import("../apps/api/src/services/orchestration/router.js"));
  ({ registerAgent, clearRegistry } = await import("../apps/api/src/services/orchestration/registry.js"));
  ({ ConnectorFactory } = await import("../apps/api/src/connectors/factory.js"));
});

describe("Mocked orchestrator persistence", () => {
  beforeEach(() => {
    resetMockData?.();
    clearRegistry?.();
    jest.clearAllMocks();
  });

  afterAll(() => {
    clearRegistry?.();
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

    if (!response.ok) {
      console.error("orchestrator response", response);
      throw new Error("Orchestrator response unexpectedly failed");
    }
    expect(response.ok).toBe(true);

    const runs = await mockPrismaClient.agentRun.findMany({});
    expect(runs).toHaveLength(1);

    const [run] = runs;
    expect(run.status).toBe("SUCCESS");
    expect(run.input).toMatchObject({ subject: "KT bundle" });
    expect(run.metrics).toMatchObject({
      intent: "kt-smoke",
      responseOk: true,
    });

    expect(mockPrismaClient.agentRun.create).toHaveBeenCalledTimes(1);
    expect(mockPrismaClient.agentRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: run.id },
        data: expect.objectContaining({ status: "SUCCESS" }),
      }),
    );

    expect(mockPrismaClient.toolExecution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentRunId: run.id,
          status: "running",
        }),
      }),
    );
    expect(mockPrismaClient.toolExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "completed" }),
      }),
    );
  });
});
