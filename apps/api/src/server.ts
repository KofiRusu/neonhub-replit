import express from "express";
import type { Express } from "express";
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
import { AppError } from "./lib/errors.js";
import { registerConnectors } from "./connectors/index.js";
import { syncRegisteredConnectors } from "./services/connector.service.js";
import connectorsRouter from "./routes/connectors.js";
import cookieParser from "cookie-parser";
import brandVoiceRouter from "./routes/brand-voice.js";
import personRouter from "./routes/person.js";
import smsRouter from "./routes/sms.js";
import socialRouter from "./routes/social.js";
import budgetRouter from "./routes/budget.js";
import { sitemapsRouter } from "./routes/sitemaps.js";
import { startSeoAnalyticsJob } from "./jobs/seo-analytics.job.js";

// Environment is validated on import

// Initialize Sentry (no-op if DSN not configured)
initSentry();

// Register connectors and sync metadata in background
registerConnectors()
  .then(syncRegisteredConnectors)
  .catch(error => {
    logger.error({ error }, "Failed to register connectors");
  });

startSeoAnalyticsJob();

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

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, "Request received");
  next();
});

// Public routes (no auth required)
app.use(healthRouter);
app.use(authRateLimit, authRouter); // Stricter rate limit on auth endpoints
app.use(sdkHandshakeRouter);
app.use("/api", sitemapsRouter);

// Protected routes (auth required + audit logging)
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
const port = env.PORT;
httpServer.listen(port, "0.0.0.0", () => {
  logger.info({ port, env: env.NODE_ENV }, "🚀 NeonHub API server started");
});

export default app;
