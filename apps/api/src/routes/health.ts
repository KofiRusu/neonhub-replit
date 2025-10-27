import { Router } from "express";
import { prisma, checkDatabaseConnection } from "../db/prisma.js";
import { getIO } from "../ws/index.js";
// Health check types defined inline
import Stripe from "stripe";
import OpenAI from "openai";
import { env } from "../config/env.js";
import { ensureOrchestratorBootstrap } from "../services/orchestration/bootstrap.js";
import { listAgents } from "../services/orchestration/index.js";

export const healthRouter = Router();

// Health check helpers
async function checkDatabase(): Promise<{ status: string; latency?: number }> {
  const start = Date.now();
  try {
    const connected = await checkDatabaseConnection();
    const latency = Date.now() - start;
    return connected ? { status: "ok", latency } : { status: "error" };
  } catch (_error) {
    return { status: "error" };
  }
}

async function checkStripe(): Promise<{ status: string }> {
  try {
    if (!env.STRIPE_SECRET_KEY) {
      return { status: "not_configured" };
    }
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2025-09-30.clover" });
    await stripe.customers.list({ limit: 1 });
    return { status: "ok" };
  } catch (_error) {
    return { status: "error" };
  }
}

async function checkOpenAI(): Promise<{ status: string }> {
  try {
    if (!env.OPENAI_API_KEY) {
      return { status: "not_configured" };
    }
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    await openai.models.list();
    return { status: "ok" };
  } catch (_error) {
    return { status: "error" };
  }
}

async function checkWebSocket(): Promise<{ status: string; connections?: number }> {
  try {
    const io = getIO();
    if (!io) {
      return { status: "error" };
    }
    const sockets = await io.fetchSockets();
    return { status: "ok", connections: sockets.length };
  } catch {
    return { status: "error" };
  }
}

async function checkVectorExtension(): Promise<{ status: string; version?: string }> {
  try {
    const result = await prisma.$queryRaw<{ version: string }[]>`
      SELECT extversion AS version FROM pg_extension WHERE extname = 'vector'
    `;

    if (Array.isArray(result) && result.length > 0) {
      return { status: "ok", version: result[0].version };
    }

    return { status: "missing" };
  } catch {
    return { status: "error" };
  }
}

async function checkAgents(): Promise<{
  status: string;
  registered: number;
  agents: Array<{ name: string; version?: string }>;
}> {
  await ensureOrchestratorBootstrap();
  const agents = listAgents().map(agent => ({ name: agent.name, version: agent.version }));
  return {
    status: agents.length > 0 ? "ok" : "empty",
    registered: agents.length,
    agents
  };
}

healthRouter.get("/health", async (_req, res) => {
  // Run all checks in parallel
  const [database, stripe, openai, websocket, vector, agents] = await Promise.all([
    checkDatabase(),
    checkStripe(),
    checkOpenAI(),
    checkWebSocket(),
    checkVectorExtension(),
    checkAgents()
  ]);

  const checks = {
    database,
    stripe,
    openai,
    websocket,
    vector,
    agents
  };

  // Determine overall health
  const criticalServices = [database.status, websocket.status, vector.status];
  const allOk = criticalServices.every(s => s === "ok");
  const anyError = Object.values(checks).some(c => c.status === "error");

  const health = {
    status: allOk ? (anyError ? "degraded" : "healthy") : "unhealthy",
    version: "3.2.0",
    checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;
  res.status(statusCode).json(health);
});

// Lightweight readiness probe (for K8s/load balancers)
healthRouter.get("/readyz", async (_req, res) => {
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      return res.status(503).json({ 
        ok: false, 
        error: "database_unreachable",
        timestamp: new Date().toISOString()
      });
    }

    // Check pgvector extension
    const vectorResult = await prisma.$queryRaw<{ extname: string }[]>`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `;
    const pgvector = Array.isArray(vectorResult) && vectorResult.length > 0;

    if (!pgvector) {
      return res.status(503).json({ 
        ok: false, 
        error: "pgvector_missing",
        timestamp: new Date().toISOString()
      });
    }

    // All good
    return res.status(200).json({ 
      ok: true, 
      pgvector: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, "Readiness check failed");
    return res.status(503).json({ 
      ok: false, 
      error: "internal_error",
      timestamp: new Date().toISOString()
    });
  }
});
