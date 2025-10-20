import { Router } from "express";
import { checkDatabaseConnection } from "../db/prisma.js";
import { getIO } from "../ws/index.js";
// Health check types defined inline
import Stripe from "stripe";
import OpenAI from "openai";
import { env } from "../config/env.js";

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

healthRouter.get("/health", async (_req, res) => {
  // Run all checks in parallel
  const [database, stripe, openai, websocket] = await Promise.all([
    checkDatabase(),
    checkStripe(),
    checkOpenAI(),
    checkWebSocket(),
  ]);

  const checks = {
    database,
    stripe,
    openai,
    websocket,
  };

  // Determine overall health
  const criticalServices = [database.status, websocket.status];
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
