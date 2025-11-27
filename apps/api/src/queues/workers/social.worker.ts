import { Worker, Job } from "bullmq";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { recordQueueJob } from "../../lib/metrics.js";

interface SocialComposePayload {
  platform: string;
  content: string;
  brandId: string;
  campaignId?: string;
}

interface SocialSendPayload {
  platform: string;
  content: string;
  accountId: string;
  scheduledFor?: Date;
  metadata?: Record<string, unknown>;
}

async function processSocialCompose(job: Job<SocialComposePayload>) {
  logger.info({ jobId: job.id, platform: job.data.platform }, "Processing social.compose job");

  // Composition logic would use SocialAgent or BrandVoiceService here
  // For now, we acknowledge the job

  return {
    composed: true,
    platform: job.data.platform,
    content: job.data.content,
  };
}

async function processSocialSend(job: Job<SocialSendPayload>) {
  logger.info({ jobId: job.id, platform: job.data.platform }, "Processing social.send job");

  // Real implementation would:
  // 1. Get connector credentials for the platform
  // 2. Use connector registry to execute post action
  // 3. Record event in EventIntakeService

  // For now, we log and acknowledge
  logger.info(
    { jobId: job.id, platform: job.data.platform, contentLength: job.data.content.length },
    "Social post would be sent here via connector"
  );

  return {
    sent: true,
    platform: job.data.platform,
    postId: `mock_${Date.now()}`,
  };
}

export function createSocialWorkers() {
  const redisUrl = env.REDIS_URL ?? "redis://localhost:6379";
  const connection = { url: redisUrl };

  const composeWorker = new Worker("social.compose", processSocialCompose, {
    connection,
    concurrency: 5,
  });

  const sendWorker = new Worker("social.send", processSocialSend, {
    connection,
    concurrency: 10,
  });

  composeWorker.on("completed", (job) => {
    recordQueueJob("social.compose", "completed");
    logger.debug({ jobId: job.id }, "social.compose job completed");
  });

  composeWorker.on("failed", (job, err) => {
    recordQueueJob("social.compose", "failed");
    logger.error({ jobId: job?.id, error: err }, "social.compose job failed");
  });

  sendWorker.on("completed", (job) => {
    recordQueueJob("social.send", "completed");
    logger.debug({ jobId: job.id }, "social.send job completed");
  });

  sendWorker.on("failed", (job, err) => {
    recordQueueJob("social.send", "failed");
    logger.error({ jobId: job?.id, error: err }, "social.send job failed");
  });

  return { composeWorker, sendWorker };
}

export async function stopSocialWorkers(workers: ReturnType<typeof createSocialWorkers>) {
  await workers.composeWorker.close();
  await workers.sendWorker.close();
  logger.info("Social workers stopped");
}

