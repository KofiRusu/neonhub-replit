import { Router } from "express";
import { checkDatabaseConnection } from "../db/prisma.js";
import { getIO } from "../ws/index.js";
import type { HealthResponse } from "../types/index.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const dbConnected = await checkDatabaseConnection();
  let wsConnected = false;

  try {
    const io = getIO();
    wsConnected = io !== null;
  } catch {
    wsConnected = false;
  }

  const health: HealthResponse = {
    status: dbConnected && wsConnected ? "ok" : "error",
    db: dbConnected,
    ws: wsConnected,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  };

  res.status(health.status === "ok" ? 200 : 503).json(health);
});
