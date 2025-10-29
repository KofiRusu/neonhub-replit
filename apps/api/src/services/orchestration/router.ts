import { logger } from "../../lib/logger.js";
import { getAgent } from "./registry.js";
import { withCircuitBreaker, withRetry, CircuitBreakerOpenError } from "./policies.js";
import { ensureOrchestratorBootstrap } from "./bootstrap.js";
import type { AgentHandler, AgentName, OrchestratorRequest, OrchestratorResponse } from "./types.js";

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

export async function route(req: OrchestratorRequest): Promise<OrchestratorResponse> {
  const span = startSpan(`orchestrator.${req.agent}.${req.intent}`);

  try {
    await ensureOrchestratorBootstrap();

    const registryEntry = getAgent(req.agent);
    if (!registryEntry) {
      return { ok: false, error: "agent_not_registered", code: "AGENT_NOT_REGISTERED" };
    }

    const authResult = ensureAuthorized(req);
    if (authResult) {
      return authResult;
    }

    const userId = req.context?.userId as string;
    const rateLimitResult = enforceRateLimit(req.agent, userId);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const executor = withRetry(getCircuit(req.agent, registryEntry.handler), {
      maxAttempts: 3,
      baseDelayMs: 75
    });

    const response = await executor(req);

    if (!response.ok) {
      const failure = response as Extract<OrchestratorResponse, { ok: false }>;
      logger.warn({ agent: req.agent, intent: req.intent, error: failure.error }, "Agent responded with error");
    }

    span.end();
    return response;
  } catch (error) {
    span.end(error);
    if (error instanceof CircuitBreakerOpenError) {
      logger.error({ agent: req.agent }, "Circuit breaker open for agent");
      return { ok: false, error: "circuit_open", code: "CIRCUIT_OPEN" };
    }

    logger.error({ agent: req.agent, intent: req.intent, error }, "Agent execution failed");
    return { ok: false, error: "agent_execution_failed", code: "AGENT_EXECUTION_FAILED" };
  }
}
