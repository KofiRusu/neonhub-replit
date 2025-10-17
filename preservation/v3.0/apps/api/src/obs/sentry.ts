import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { getEnv } from "../config/env.js";
import { logger } from "../lib/logger.js";

export function initSentry(): void {
  const env = getEnv();
  
  if (!env.SENTRY_DSN) {
    logger.info("Sentry DSN not configured - error tracking disabled");
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
    profilesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
  });

  logger.info("✅ Sentry initialized");
}

export { Sentry };
