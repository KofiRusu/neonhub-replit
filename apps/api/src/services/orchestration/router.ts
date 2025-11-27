import { RunStatus as RunStatusEnum } from "@prisma/client";
import { logger } from "../../lib/logger.js";
import { getAgent } from "./registry.js";
import { withCircuitBreaker, withRetry, CircuitBreakerOpenError } from "./policies.js";
import { ensureOrchestratorBootstrap } from "./bootstrap.js";
import { executeAgentRun } from "../../agents/utils/agent-run.js";
import { prisma } from "../../db/prisma.js";
import { recordAgentRun, recordCircuitBreakerFailure, recordRateLimitHit } from "../../lib/metrics.js";
import type { AgentHandler, AgentName, OrchestratorRequest, OrchestratorResponse } from "./types.js";
import { resolveAgentForIntent } from "./intents.js";

type CircuitWrapped = (req: OrchestratorRequest) => Promise<OrchestratorResponse>;

const circuitMap = new Map<AgentName, CircuitWrapped>();
const rateState = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_PER_MINUTE = 60;
const RATE_WINDOW_MS = 60_000;

function startSpan(name: string) {
  const globalAny = globalThis as any;
  const tracer = globalAny?.otel?.trace?.getTracer?.("neonhub");
  if (tracer) {
    const span = tracer.startSpan(name);
    return {
      span,
      end(error?: unknown) {
        if (error instanceof Error) {
          span.recordException(error);
          span.setStatus({ code: 2, message: error.message }); // 2 = ERROR
        }
        span.end();
      }
    };
  }

  const startedAt = Date.now();
  return {
    span: null,
    end(error?: unknown) {
      const duration = Date.now() - startedAt;
      if (error) {
        logger.error({ duration, error }, "Orchestrator span completed with error");
      } else {
        logger.debug({ duration }, "Orchestrator span completed");
      }
    }
  };
}

function ensureAuthorized(req: OrchestratorRequest): OrchestratorResponse | undefined {
  const userId = req.context && typeof req.context.userId === "string" ? req.context.userId : undefined;
  if (!userId) {
    return { ok: false, error: "unauthorized", code: "UNAUTHENTICATED" };
  }
  return undefined;
}

function enforceRateLimit(agent: AgentName, userId: string): OrchestratorResponse | undefined {
  const key = `${agent}:${userId}`;
  const now = Date.now();
  const entry = rateState.get(key);

  if (!entry || now > entry.resetAt) {
    rateState.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return undefined;
  }

  if (entry.count >= RATE_LIMIT_PER_MINUTE) {
    // Record rate limit hit in metrics
    recordRateLimitHit(agent, userId);
    return { ok: false, error: "rate_limited", code: "RATE_LIMITED" };
  }

  entry.count += 1;
  return undefined;
}

function getCircuit(agent: AgentName, handler: AgentHandler): CircuitWrapped {
  const existing = circuitMap.get(agent);
  if (existing) {
    return existing;
  }

  const wrapped = withCircuitBreaker(
    async (request: OrchestratorRequest) => handler.handle(request),
    { failThreshold: 3, cooldownMs: 10_000 }
  );

  circuitMap.set(agent, wrapped);
  return wrapped;
}

function attachMeta(
  response: OrchestratorResponse,
  meta: { agent?: string; intent?: string; runId?: string; metrics?: Record<string, unknown> } = {},
): OrchestratorResponse {
  if (!meta.agent && !meta.intent && !meta.runId && !meta.metrics) {
    return response;
  }
  return {
    ...response,
    meta: {
      ...(response.meta ?? {}),
      ...meta,
      metrics: {
        ...(response.meta?.metrics ?? {}),
        ...(meta.metrics ?? {}),
      },
    },
  };
}

export async function route(req: OrchestratorRequest): Promise<OrchestratorResponse> {
  let agentName: AgentName | undefined;
  const span = startSpan(`orchestrator.${req.agent ?? "unknown"}.${req.intent}`);

  try {
    await ensureOrchestratorBootstrap();

    const intentResolution = resolveAgentForIntent(req.intent, req.agent);
    if (!intentResolution.ok) {
      if ("reason" in intentResolution && intentResolution.reason === "AGENT_REQUIRED") {
        return attachMeta(
          { ok: false, error: "agent_required_for_intent", code: "AGENT_REQUIRED" },
          { intent: req.intent },
        );
      }
      if ("reason" in intentResolution && intentResolution.reason === "INTENT_AGENT_MISMATCH") {
        const expectedAgent = "expected" in intentResolution ? intentResolution.expected : req.agent;
        return attachMeta(
          {
            ok: false,
            error: `Intent ${req.intent} must run on ${expectedAgent ?? "registered agent"}`,
            code: "INTENT_AGENT_MISMATCH",
          },
          { intent: req.intent, agent: expectedAgent },
        );
      }
      return attachMeta(
        { ok: false, error: "intent_resolution_failed", code: "INTENT_RESOLUTION_FAILED" },
        { intent: req.intent },
      );
    }

    agentName = intentResolution.agent;

    const registryEntry = getAgent(agentName);
    if (!registryEntry) {
      return attachMeta(
        { ok: false, error: "agent_not_registered", code: "AGENT_NOT_REGISTERED" },
        { agent: agentName, intent: req.intent },
      );
    }

    const authResult = ensureAuthorized(req);
    if (authResult) {
      return attachMeta(authResult, { agent: agentName, intent: req.intent });
    }

    const userId = req.context?.userId as string;
    const rateLimitResult = enforceRateLimit(agentName, userId);
    if (rateLimitResult) {
      return attachMeta(rateLimitResult, { agent: agentName, intent: req.intent });
    }

    // Find or create Agent record in database for persistence
    const organizationId = req.context?.organizationId as string;
    if (!organizationId) {
      logger.warn({ agent: agentName }, "No organizationId in context, skipping AgentRun persistence");
      // Fallback to in-memory execution without persistence
      const executor = withRetry(getCircuit(agentName, registryEntry.handler), {
        maxAttempts: 3,
        baseDelayMs: 75
      });
      const normalizedRequest: OrchestratorRequest = { ...req, agent: agentName };
      const response = await executor(normalizedRequest);
      span.end();
      return attachMeta(response, { agent: agentName, intent: req.intent });
    }

    // Get or create agent in database
    let dbAgent = await prisma.agent.findFirst({
      where: {
        organizationId,
        name: agentName,
      }
    });

    if (!dbAgent) {
      // Create agent record if it doesn't exist
      dbAgent = await prisma.agent.create({
        data: {
          organization: { connect: { id: organizationId } },
          name: agentName,
          slug: agentName.toLowerCase().replace(/agent$/i, ''),
          kind: "COPILOT", // Default, should be properly typed
          status: "ACTIVE",
          description: `Auto-created agent for ${agentName}`,
          config: {},
        }
      });
      logger.info({ agentId: dbAgent.id, agentName }, "Created new agent record");
    }

    // Track start time for metrics
    const startTime = Date.now();

    // Execute with AgentRun persistence
    const resolvedRequest: OrchestratorRequest = { ...req, agent: agentName };
    const { runId, result: response } = await executeAgentRun(
      dbAgent.id,
      {
        organizationId,
        userId,
        prisma,
        agentName: dbAgent.name ?? agentName,
      },
      resolvedRequest.payload,
      async () => {
        const executor = withRetry(getCircuit(agentName, registryEntry.handler), {
          maxAttempts: 3,
          baseDelayMs: 75,
        });
        return executor(resolvedRequest);
      },
      {
        intent: req.intent,
        buildMetrics: (result) => ({
          agent: agentName,
          intent: req.intent,
          responseOk: result.ok,
        }),
        emitTelemetry: false,
      },
    );

    // Calculate duration and record metrics
    const durationSeconds = (Date.now() - startTime) / 1000;
    const status = response.ok ? RunStatusEnum.SUCCESS : RunStatusEnum.FAILED;
    recordAgentRun(agentName, status, durationSeconds, req.intent);

    const enriched = attachMeta(response, {
      agent: agentName,
      intent: req.intent,
      runId,
      metrics: { durationSeconds },
    });

    logger.info({ runId, agent: agentName, intent: req.intent, durationSeconds }, "Agent run completed with persistence");

    if (!response.ok) {
      logger.warn({ runId, agent: agentName, intent: req.intent, error: response.error }, "Agent responded with error");
    }

    span.end();
    return enriched;
  } catch (error) {
    span.end(error);
    const fallbackAgent = agentName ?? req.agent ?? "unknown";
    if (error instanceof CircuitBreakerOpenError) {
      logger.error({ agent: fallbackAgent }, "Circuit breaker open for agent");
      // Record circuit breaker failure in metrics
      recordCircuitBreakerFailure(fallbackAgent);
      return attachMeta(
        { ok: false, error: "circuit_open", code: "CIRCUIT_OPEN" },
        { agent: fallbackAgent as AgentName, intent: req.intent },
      );
    }

    logger.error({ agent: fallbackAgent, intent: req.intent, error }, "Agent execution failed");
    // Record failed agent run
    recordAgentRun(fallbackAgent, RunStatusEnum.FAILED, 0, req.intent);
    return attachMeta(
      { ok: false, error: "agent_execution_failed", code: "AGENT_EXECUTION_FAILED" },
      { agent: fallbackAgent as AgentName, intent: req.intent },
    );
  }
}

export function __resetOrchestratorState(): void {
  circuitMap.clear();
  rateState.clear();
}
