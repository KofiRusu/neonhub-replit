import express from "express";
import { createServer } from "http";
import { env } from "./config/env.js";
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
import credentialsRouter from "./routes/credentials.js";
import settingsRouter from "./routes/settings.js";
import predictiveRouter from "./routes/predictive.js";
import governanceRouter from "./routes/governance.js";
import dataTrustRouter from "./routes/data-trust.js";
import ecoMetricsRouter from "./routes/eco-metrics.js";
import orchestrationRouter from "./routes/orchestration.js";
import { stripeWebhookRouter } from "./routes/stripe-webhook.js";
import billingRouter from "./routes/billing.js";
import { AppError } from "./lib/errors.js";

// Environment is validated on import

// Initialize Sentry (no-op if DSN not configured)
initSentry();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Initialize WebSocket
initWebSocket(httpServer);

// Security Middleware Stack (Week 3)
// 1. Body parsing with size limits (1MB)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 2. Security headers (global)
app.use(securityHeaders);

// 3. Strict CORS
app.use(strictCORS);

// 4. Rate limiting (global, with feature flag support)
app.use(rateLimit);

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, "Request received");
  next();
});

// Public routes (no auth required)
app.use(healthRouter);
app.use(authRateLimit, authRouter); // Stricter rate limit on auth endpoints
app.use(stripeWebhookRouter); // Webhook must use raw body

// Protected routes (auth required + audit logging)
app.use(requireAuth, contentRouter);
app.use(requireAuth, metricsRouter);
app.use(requireAuth, jobsRouter);
app.use('/api/campaigns', requireAuth, auditMiddleware('campaign'), campaignRouter);
app.use('/api/credentials', requireAuth, auditMiddleware('credential'), credentialsRouter);
app.use('/api/settings', requireAuth, adminIPGuard, auditMiddleware('settings'), settingsRouter);
app.use('/api/predictive', requireAuth, predictiveRouter);
app.use('/api/governance', requireAuth, adminIPGuard, auditMiddleware('governance'), governanceRouter);
app.use('/api/data-trust', requireAuth, adminIPGuard, auditMiddleware('data-trust'), dataTrustRouter);
app.use('/api/eco-metrics', requireAuth, adminIPGuard, auditMiddleware('eco-metrics'), ecoMetricsRouter);
app.use('/api/orchestration', requireAuth, adminIPGuard, auditMiddleware('orchestration'), orchestrationRouter);
app.use('/api', requireAuth, billingRouter); // Billing routes with auth

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
const port = env.PORT;
httpServer.listen(port, "0.0.0.0", () => {
  logger.info({ port, env: env.NODE_ENV }, "🚀 NeonHub API server started");
});

export default app;