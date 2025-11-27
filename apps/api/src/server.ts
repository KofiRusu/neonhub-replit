/**
 * NeonHub API Server - Entry Point
 * Instrumented for bootstrap debugging (STEP 2)
 */

import { appendFileSync } from "fs";
const bootLog = (msg: string) => {
  console.log(msg);
  try {
    appendFileSync("/tmp/neonhub-boot.log", msg + "\n");
  } catch (_e) {
    // Ignore if file write fails
  }
};

bootLog("[BOOT] 00 - Module loading starting");

import express from "express";
import type { Express } from "express";
import { createServer } from "http";
import { env } from "./config/env.js";

bootLog("[BOOT] 01 - Env config loaded");
import { logger } from "./lib/logger.js";
import { initWebSocket } from "./ws/index.js";
import { initSentry, Sentry } from "./obs/sentry.js";
import { requireAuth } from "./middleware/auth.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { strictCORS } from "./middleware/cors.js";
import { rateLimit, authRateLimit } from "./middleware/rateLimit.js";
import { adminIPGuard } from "./middleware/adminGuard.js";
import { auditMiddleware } from "./middleware/auditLog.js";
import { healthRouter } from "./routes/health.js";
import { contentRouter } from "./routes/content.js";
import { metricsRouter } from "./routes/metrics.js";
import { authRouter } from "./routes/auth.js";
import { jobsRouter } from "./routes/jobs.js";
import { campaignRouter } from "./routes/campaign.js";
import { marketingRouter } from "./routes/marketing.js";
import credentialsRouter from "./routes/credentials.js";
import settingsRouter from "./routes/settings.js";
import predictiveRouter from "./routes/predictive.js";
import governanceRouter from "./routes/governance.js";
import dataTrustRouter from "./routes/data-trust.js";
import ecoMetricsRouter from "./routes/eco-metrics.js";
import orchestrationRouter from "./routes/orchestration.js";
import { stripeWebhookRouter } from "./routes/stripe-webhook.js";
import billingRouter from "./routes/billing.js";
import documentsRouter from "./routes/documents.js";
import tasksRouter from "./routes/tasks.js";
import feedbackRouter from "./routes/feedback.js";
import messagesRouter from "./routes/messages.js";
import { teamRouter } from "./routes/team.js";
import { trendsRouter } from "./routes/trends.js";
import personasRouter from "./routes/personas.js";
import keywordsRouter from "./routes/keywords.js";
import editorialCalendarRouter from "./routes/editorial-calendar.js";
import seoRouter from "./routes/seo/index.js";
import { sdkHandshakeRouter } from "./routes/sdk-handshake.js";
import { orchestrateRouter } from "./routes/orchestrate.js";
import { AppError } from "./lib/errors.js";
import { registerConnectors } from "./connectors/index.js";
import { syncRegisteredConnectors } from "./services/connector.service.js";
import connectorsRouter from "./routes/connectors.js";
import { getMetrics, recordHttpRequest } from "./lib/metrics.js";
import cookieParser from "cookie-parser";
import brandVoiceRouter from "./routes/brand-voice.js";
import personRouter from "./routes/person.js";
import smsRouter from "./routes/sms.js";
import socialRouter from "./routes/social.js";
import budgetRouter from "./routes/budget.js";
import { sitemapsRouter } from "./routes/sitemaps.js";
import { startSeoAnalyticsJob } from "./jobs/seo-analytics.job.js";
import { registerDefaultAgents } from "./services/orchestration/register-agents.js";
import { startAllWorkers, stopAllWorkers } from "./queues/workers/index.js";

bootLog("[BOOT] 02 - All imports complete");

// Environment is validated on import

// ════════════════════════════════════════════════════════════════════════
// BOOTSTRAP PHASE - WITH TIMEOUT GUARDS
// ════════════════════════════════════════════════════════════════════════

/**
 * Wraps a promise with a timeout guard to detect hangs
 * @param promise Promise to wrap
 * @param label Debug label for timeout
 * @param ms Timeout in milliseconds (default 30s)
 */
async function withBootstrapTimeout<T>(
  promise: Promise<T>,
  label: string,
  ms = 30000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        bootLog(`[BOOT] ⏱️  TIMEOUT: ${label} exceeded ${ms}ms - may hang indefinitely`);
        reject(new Error(`Bootstrap timeout: ${label}`));
      }, ms)
    ),
  ]);
}

bootLog("[BOOT] 03 - Starting async initialization");

// Run async initialization in background without blocking server startup
(async () => {
  try {
    // STEP 1: Initialize Sentry (no-op if DSN not configured)
    try {
      bootLog("[BOOT] 04 - Sentry init starting");
      initSentry();
      bootLog("[BOOT] 05 - Sentry init complete");
    } catch (err) {
      bootLog("[BOOT] ❌ Sentry init failed: " + err);
      // Non-blocking; continue
    }

    // STEP 2: Register connectors and sync metadata
    // ONLY if enabled in dev mode (default: skip)
    if (process.env.ENABLE_CONNECTORS !== "true") {
      bootLog("[BOOT] 06 - SKIPPED registerConnectors (ENABLE_CONNECTORS=false)");
    } else {
      try {
        bootLog("[BOOT] 06 - registerConnectors starting");
        await withBootstrapTimeout(
          (async () => {
            await registerConnectors();
            await syncRegisteredConnectors();
          })(),
          "registerConnectors + sync",
          15000
        );
        bootLog("[BOOT] 07 - registerConnectors complete");
      } catch (err) {
        bootLog("[BOOT] ❌ Connectors failed: " + (err instanceof Error ? err.message : err));
        if (process.env.NODE_ENV === "production") throw err;
      }
    }

    // STEP 3: SEO Analytics Job
    // ONLY if enabled in dev mode (default: skip)
    if (process.env.ENABLE_SEO_ANALYTICS_JOB !== "true") {
      bootLog("[BOOT] 08 - SKIPPED startSeoAnalyticsJob (ENABLE_SEO_ANALYTICS_JOB=false)");
    } else {
      try {
        bootLog("[BOOT] 08 - SEO Analytics Job starting");
        await withBootstrapTimeout(startSeoAnalyticsJob(), "startSeoAnalyticsJob", 10000);
        bootLog("[BOOT] 09 - SEO Analytics Job complete");
      } catch (err) {
        bootLog("[BOOT] ❌ SEO Analytics Job failed: " + (err instanceof Error ? err.message : err));
        if (process.env.NODE_ENV === "production") throw err;
      }
    }

    // STEP 4: Queue Workers
    // ONLY if enabled in dev mode (default: skip)
    if (process.env.ENABLE_WORKERS !== "true") {
      bootLog("[BOOT] 10 - SKIPPED startAllWorkers (ENABLE_WORKERS=false)");
    } else {
      try {
        bootLog("[BOOT] 10 - Queue Workers starting");
        await withBootstrapTimeout(startAllWorkers(), "startAllWorkers", 15000);
        bootLog("[BOOT] 11 - Queue Workers complete");
      } catch (err) {
        bootLog("[BOOT] ❌ Queue Workers failed: " + (err instanceof Error ? err.message : err));
        if (process.env.NODE_ENV === "production") throw err;
      }
    }

    // STEP 5: Register Default Agents
    // ONLY if enabled in dev mode (default: skip)
    if (process.env.ENABLE_ORCHESTRATION_BOOTSTRAP !== "true") {
      bootLog("[BOOT] 12 - SKIPPED registerDefaultAgents (ENABLE_ORCHESTRATION_BOOTSTRAP=false)");
    } else {
      try {
        bootLog("[BOOT] 12 - Default Agents registration starting");
        registerDefaultAgents();
        bootLog("[BOOT] 13 - Default Agents registration complete");
      } catch (err) {
        bootLog("[BOOT] ❌ Default Agents failed: " + (err instanceof Error ? err.message : err));
        if (process.env.NODE_ENV === "production") throw err;
      }
    }

    bootLog("[BOOT] 14 - Bootstrap initialization complete");
  } catch (err) {
    bootLog("[BOOT] ❌ FATAL: Bootstrap failed: " + err);
    process.exit(1);
  }
})();

// Create Express app
const app: Express = express();
const httpServer = createServer(app);

// Initialize WebSocket
initWebSocket(httpServer);

// Stripe webhook must receive raw body before any JSON middleware
app.use("/api/billing/webhook", stripeWebhookRouter);

// Security Middleware Stack (Week 3)
// 1. Body parsing with size limits (1MB) for all non-webhook routes
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 2. Cookie parsing for session auth
app.use(cookieParser(env.NEXTAUTH_SECRET));

// 3. Security headers (global)
app.use(securityHeaders);

// 4. Strict CORS
app.use(strictCORS);

// 5. Rate limiting (global, with feature flag support)
app.use(rateLimit);

// Request logging with metrics
app.use((req, res, next) => {
  const startTime = Date.now();
  logger.info({ method: req.method, url: req.url }, "Request received");
  
  // Record metrics when response finishes
  res.on("finish", () => {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const route = req.route?.path || req.url;
    recordHttpRequest(req.method, route, res.statusCode, duration);
  });
  
  next();
});

// Public routes (no auth required)
app.use(healthRouter);
app.use(authRateLimit, authRouter); // Stricter rate limit on auth endpoints
app.use(sdkHandshakeRouter);
app.use("/api", sitemapsRouter);

// Prometheus metrics endpoint (public, typically accessed by Prometheus scraper)
app.get("/metrics", async (_req, res) => {
  try {
    res.set("Content-Type", "text/plain; version=0.0.4");
    const metrics = await getMetrics();
    res.send(metrics);
  } catch (error) {
    logger.error({ error }, "Failed to generate metrics");
    res.status(500).send("Error generating metrics");
  }
});

// // Protected routes (auth required + audit logging)  TEMP: Skip problematic routes
// app.use("/api", requireAuth, orchestrateRouter);
app.use(requireAuth, contentRouter);
app.use(requireAuth, metricsRouter);
app.use(requireAuth, jobsRouter);
app.use('/api/campaigns', requireAuth, auditMiddleware('campaign'), campaignRouter);
app.use('/api/marketing', requireAuth, auditMiddleware('marketing'), marketingRouter);
app.use('/api/credentials', requireAuth, auditMiddleware('credential'), credentialsRouter);
app.use('/api/settings', requireAuth, adminIPGuard, auditMiddleware('settings'), settingsRouter);
app.use('/api/predictive', requireAuth, predictiveRouter);
app.use('/api/governance', requireAuth, adminIPGuard, auditMiddleware('governance'), governanceRouter);
app.use('/api/data-trust', requireAuth, adminIPGuard, auditMiddleware('data-trust'), dataTrustRouter);
app.use('/api/eco-metrics', requireAuth, adminIPGuard, auditMiddleware('eco-metrics'), ecoMetricsRouter);
app.use('/api/orchestration', requireAuth, adminIPGuard, auditMiddleware('orchestration'), orchestrationRouter);
app.use('/api', requireAuth, billingRouter); // Billing routes with auth

// Phase 4 Beta routes
app.use('/api/documents', requireAuth, auditMiddleware('document'), documentsRouter);
app.use('/api/tasks', requireAuth, auditMiddleware('task'), tasksRouter);
app.use('/api/feedback', requireAuth, auditMiddleware('feedback'), feedbackRouter);
app.use('/api/messages', requireAuth, auditMiddleware('message'), messagesRouter);
app.use('/api/team', requireAuth, auditMiddleware('team'), teamRouter);
app.use('/api/trends', requireAuth, trendsRouter);
app.use('/api/connectors', requireAuth, auditMiddleware('connector'), connectorsRouter);
app.use('/api/personas', requireAuth, auditMiddleware('persona'), personasRouter);
app.use('/api/keywords', requireAuth, auditMiddleware('keyword'), keywordsRouter);
app.use('/api/editorial-calendar', requireAuth, auditMiddleware('editorial-calendar'), editorialCalendarRouter);
app.use('/api/seo', requireAuth, auditMiddleware('seo'), seoRouter);
app.use('/api/brand-voice', requireAuth, brandVoiceRouter);
app.use('/api/person', requireAuth, personRouter);
app.use('/api/budget', requireAuth, budgetRouter);
app.use('/api/sms', smsRouter);
app.use('/api/social', socialRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Capture error in Sentry
  if (!(err instanceof AppError) || err.statusCode >= 500) {
    Sentry.captureException(err);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

// Start server
bootLog("[BOOT] 15 - About to call httpServer.listen() on port " + env.PORT);
const port = env.PORT;
httpServer.listen(port, "0.0.0.0", () => {
  bootLog("[BOOT] ✓ 16 - SERVER LISTENING ON PORT " + port);
  logger.info({ port, env: env.NODE_ENV }, "🚀 NeonHub API server started");
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info({ signal }, "Received shutdown signal, closing gracefully...");
  
  // Stop accepting new connections
  httpServer.close(() => {
    logger.info("HTTP server closed");
  });
  
  // Stop queue workers
  await stopAllWorkers();
  
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
