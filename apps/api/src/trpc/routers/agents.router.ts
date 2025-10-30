import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { OrchestratorRequest, OrchestratorResponse } from "../../services/orchestration/types.js";
import { createTRPCRouter, protectedProcedure } from "../trpc.js";

type AgentInstance = {
  handle: (request: OrchestratorRequest) => Promise<OrchestratorResponse>;
};

const agentRegistry = {
  email: {
    load: async () => (await import("../../agents/EmailAgent.js")).emailAgent as AgentInstance,
    orchestratorAgentId: "EmailAgent" as OrchestratorRequest["agent"],
  },
  seo: {
    load: async () => (await import("../../agents/SEOAgent.js")).seoAgent as AgentInstance,
    orchestratorAgentId: "SEOAgent" as OrchestratorRequest["agent"],
  },
  social: {
    load: async () => (await import("../../agents/SocialAgent.js")).socialAgent as AgentInstance,
    orchestratorAgentId: "SocialAgent" as OrchestratorRequest["agent"],
  },
  content: {
    load: async () => (await import("../../agents/content/ContentAgent.js")).contentAgent as AgentInstance,
    orchestratorAgentId: "ContentAgent" as OrchestratorRequest["agent"],
  },
  support: {
    load: async () => (await import("../../agents/SupportAgent.js")).supportAgent as AgentInstance,
    orchestratorAgentId: "SupportAgent" as OrchestratorRequest["agent"],
  },
} as const;

type AgentKey = keyof typeof agentRegistry;

const agentKeySchema = z.enum(["email", "seo", "social", "content", "support"]);

function normalizeAgentId(agentId: string | undefined): string | undefined {
  if (!agentId) return undefined;

  const map: Record<string, string> = {
    email: agentRegistry.email.orchestratorAgentId,
    "email-agent": agentRegistry.email.orchestratorAgentId,
    EmailAgent: agentRegistry.email.orchestratorAgentId,
    seo: agentRegistry.seo.orchestratorAgentId,
    "seo-agent": agentRegistry.seo.orchestratorAgentId,
    SEOAgent: agentRegistry.seo.orchestratorAgentId,
    social: agentRegistry.social.orchestratorAgentId,
    "social-agent": agentRegistry.social.orchestratorAgentId,
    SocialAgent: agentRegistry.social.orchestratorAgentId,
    content: agentRegistry.content.orchestratorAgentId,
    "content-agent": agentRegistry.content.orchestratorAgentId,
    ContentAgent: agentRegistry.content.orchestratorAgentId,
    support: agentRegistry.support.orchestratorAgentId,
    "support-agent": agentRegistry.support.orchestratorAgentId,
    SupportAgent: agentRegistry.support.orchestratorAgentId,
  };

  return map[agentId] ?? agentId;
}

export const agentsRouter = createTRPCRouter({
  execute: protectedProcedure
    .input(
      z.object({
        agent: agentKeySchema,
        intent: z.string().min(1, "intent is required"),
        payload: z.unknown().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const registryEntry = agentRegistry[input.agent as AgentKey];
      const agent = await registryEntry.load();

      const organizationId =
        typeof ctx.user?.organizationId === "string" && ctx.user.organizationId.trim().length > 0
          ? ctx.user.organizationId
          : null;

      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Authenticated user is missing an organization context.",
        });
      }

      const result = await agent.handle({
        agent: registryEntry.orchestratorAgentId,
        intent: input.intent,
        payload: input.payload,
        context: {
          organizationId,
          userId: ctx.user.id,
          prisma: ctx.prisma,
          logger: ctx.logger,
        },
      });

      return result;
    }),

  listRuns: protectedProcedure
    .input(
      z.object({
        agentId: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      const organizationId =
        typeof ctx.user?.organizationId === "string" && ctx.user.organizationId.trim().length > 0
          ? ctx.user.organizationId
          : null;

      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Authenticated user is missing an organization context.",
        });
      }

      const normalizedAgentId = normalizeAgentId(input.agentId);

      const runs = await ctx.prisma.agentRun.findMany({
        where: {
          organizationId,
          ...(normalizedAgentId ? { agentId: normalizedAgentId } : {}),
        },
        orderBy: { startedAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          agentId: true,
          status: true,
          startedAt: true,
          completedAt: true,
          metrics: true,
        },
      });

      return runs;
    }),

  getRun: protectedProcedure
    .input(z.object({ runId: z.string().min(1, "runId is required") }))
    .query(async ({ input, ctx }) => {
      const organizationId =
        typeof ctx.user?.organizationId === "string" && ctx.user.organizationId.trim().length > 0
          ? ctx.user.organizationId
          : null;

      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Authenticated user is missing an organization context.",
        });
      }

      const run = await ctx.prisma.agentRun.findFirst({
        where: {
          id: input.runId,
          organizationId,
        },
      });

      if (!run) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent run not found",
        });
      }

      return run;
    }),
});
