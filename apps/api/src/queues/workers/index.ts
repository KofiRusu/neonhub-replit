import { logger } from "../../lib/logger.js";
import { createEmailWorkers, stopEmailWorkers } from "./email.worker.js";
import { createSmsWorkers, stopSmsWorkers } from "./sms.worker.js";
import { createSocialWorkers, stopSocialWorkers } from "./social.worker.js";

interface WorkerGroup {
  email: ReturnType<typeof createEmailWorkers>;
  sms: ReturnType<typeof createSmsWorkers>;
  social: ReturnType<typeof createSocialWorkers>;
}

let workers: WorkerGroup | null = null;

/**
 * Start all queue workers
 * Call this from server.ts to enable queue processing
 */
export async function startAllWorkers(): Promise<void> {
  if (workers) {
    logger.warn("Workers already started - skipping duplicate initialization");
    return;
  }

  logger.info("Starting all queue workers...");

  workers = {
    email: createEmailWorkers(),
    sms: createSmsWorkers(),
    social: createSocialWorkers(),
  };

  logger.info("✅ All queue workers started (email, sms, social)");
}

/**
 * Stop all queue workers gracefully
 */
export async function stopAllWorkers(): Promise<void> {
  if (!workers) {
    logger.warn("Workers not running - nothing to stop");
    return;
  }

  logger.info("Stopping all queue workers...");

  await Promise.all([
    stopEmailWorkers(workers.email),
    stopSmsWorkers(workers.sms),
    stopSocialWorkers(workers.social),
  ]);

  workers = null;
  logger.info("✅ All queue workers stopped");
}

/**
 * Check if workers are running
 */
export function areWorkersRunning(): boolean {
  return workers !== null;
}

