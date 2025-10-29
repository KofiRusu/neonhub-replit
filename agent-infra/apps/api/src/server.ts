import express from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { collectMetrics } from "./metrics.js";
import { orchestrate } from "./services/orchestrator/index.js";
import { logger } from "./lib/logger.js";
import { assertDatabaseConnection, prisma } from "./db/prisma.js";
import { appConfig } from "./config.js";

const orchestrateSchema = z.object({
  workspaceSlug: z.string().min(1),
  workflowName: z.string().min(1),
  input: z.record(z.string(), z.unknown()).optional(),
  trigger: z.enum(["manual", "schedule", "webhook"]).optional(),
  idempotencyKey: z.string().min(8).max(128).optional()
});

export function createServer() {
  const app = express();
  app.use(express.json());

  app.get("/health", async (_req: Request, res: Response) => {
    try {
      await assertDatabaseConnection();
      res.json({ status: "ok" });
    } catch (error) {
      res.status(500).json({ status: "error", error: (error as Error).message });
    }
  });

  app.post("/orchestrate", async (req: Request, res: Response) => {
    try {
      const body = orchestrateSchema.parse(req.body ?? {});
      const result = await orchestrate(body);
      res.status(202).json({
        runId: result.runId,
        status: result.status,
        steps: result.stepsEnqueued.length
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "invalid_request",
          details: error.flatten()
        });
      }
      logger.error({ error }, "Orchestration request failed");
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/runs/:id", async (req: Request, res: Response) => {
    try {
      const run = await prisma.agentRun.findUnique({
        where: { id: req.params.id },
        include: {
          steps: {
            orderBy: { createdAt: "asc" }
          },
          metrics: true
        }
      });

      if (!run) {
        return res.status(404).json({ error: "run_not_found" });
      }

      res.json({ run });
    } catch (error) {
      logger.error({ error }, "Failed to fetch run");
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/metrics", async (_req: Request, res: Response) => {
    if (!appConfig.metricsEnabled) {
      return res.status(404).end();
    }
    const metrics = await collectMetrics();
    res.set("Content-Type", "text/plain");
    res.send(metrics);
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  const app = createServer();
  const port = appConfig.port;
  assertDatabaseConnection()
    .then(() => {
      app.listen(port, () => {
        logger.info({ port }, "Agent API listening");
      });
    })
    .catch(error => {
      logger.error({ error }, "Database connection failed on startup");
      process.exit(1);
    });
}
