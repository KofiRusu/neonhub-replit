import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { loadEnv, getEnv } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { initWebSocket } from "./ws/index.js";
import { initSentry, Sentry } from "./obs/sentry.js";
import { healthRouter } from "./routes/health.js";
import { contentRouter } from "./routes/content.js";
import { metricsRouter } from "./routes/metrics.js";
import { authRouter } from "./routes/auth.js";
import { jobsRouter } from "./routes/jobs.js";
import { teamRouter } from "./routes/team.js";
import { billingRouter } from "./routes/billing.js";
import { stripeWebhookRouter } from "./routes/stripe-webhook.js";
import { AppError } from "./lib/errors.js";

// Load environment
loadEnv();
const env = getEnv();

// Initialize Sentry (no-op if DSN not configured)
initSentry();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Initialize WebSocket
initWebSocket(httpServer);

// Middleware
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
}));

// CORS with allowlist
const corsOrigins = process.env.CORS_ORIGIN?.split(",") || [
  env.NEXTAUTH_URL || "http://127.0.0.1:3000",
  "http://localhost:3000",
];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
  max: parseInt(process.env.RATE_LIMIT_MAX || "120"),
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Stripe webhook MUST be registered before express.json() to preserve raw body
app.use(stripeWebhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, "Request received");
  next();
});

// Routes
app.use(healthRouter);
app.use(contentRouter);
app.use(metricsRouter);
app.use(authRouter);
app.use(jobsRouter);
app.use(teamRouter);
app.use(billingRouter);

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
const port = parseInt(env.PORT);
httpServer.listen(port, "0.0.0.0", () => {
  logger.info({ port, env: env.NODE_ENV }, "🚀 NeonHub API server started");
});

export default app;