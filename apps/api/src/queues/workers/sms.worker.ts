import { Worker, Job } from "bullmq";
import twilio from "twilio";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { recordQueueJob } from "../../lib/metrics.js";

const twilioClient =
  env.TWILIO_SID && env.TWILIO_AUTH_TOKEN
    ? twilio(env.TWILIO_SID, env.TWILIO_AUTH_TOKEN)
    : null;

interface SmsComposePayload {
  personId: string;
  objective: string;
  brandId: string;
  operatorId?: string;
}

interface SmsSendPayload {
  to: string;
  body: string;
  from?: string;
  metadata?: Record<string, unknown>;
}

async function processSmsCompose(job: Job<SmsComposePayload>) {
  logger.info({ jobId: job.id, personId: job.data.personId }, "Processing sms.compose job");

  // Composition logic would use BrandVoiceService.compose() here
  // For now, we acknowledge the job

  return {
    composed: true,
    personId: job.data.personId,
    objective: job.data.objective,
  };
}

async function processSmsSend(job: Job<SmsSendPayload>) {
  logger.info({ jobId: job.id, to: job.data.to }, "Processing sms.send job");

  if (!twilioClient) {
    logger.warn({ jobId: job.id }, "Twilio not configured - skipping SMS send");
    return { sent: false, reason: "Twilio not configured" };
  }

  const from = job.data.from ?? env.TWILIO_PHONE_NUMBER;
  if (!from) {
    throw new Error("No Twilio phone number configured");
  }

  try {
    const message = await twilioClient.messages.create({
      from,
      to: job.data.to,
      body: job.data.body,
    });

    logger.info({ jobId: job.id, messageSid: message.sid }, "SMS sent successfully");

    return {
      sent: true,
      messageSid: message.sid,
      to: job.data.to,
    };
  } catch (error) {
    logger.error({ jobId: job.id, error, to: job.data.to }, "Failed to send SMS");
    throw error;
  }
}

export function createSmsWorkers() {
  const redisUrl = env.REDIS_URL ?? "redis://localhost:6379";
  const connection = { url: redisUrl };

  const composeWorker = new Worker("sms.compose", processSmsCompose, {
    connection,
    concurrency: 5,
  });

  const sendWorker = new Worker("sms.send", processSmsSend, {
    connection,
    concurrency: 10,
  });

  composeWorker.on("completed", (job) => {
    recordQueueJob("sms.compose", "completed");
    logger.debug({ jobId: job.id }, "sms.compose job completed");
  });

  composeWorker.on("failed", (job, err) => {
    recordQueueJob("sms.compose", "failed");
    logger.error({ jobId: job?.id, error: err }, "sms.compose job failed");
  });

  sendWorker.on("completed", (job) => {
    recordQueueJob("sms.send", "completed");
    logger.debug({ jobId: job.id }, "sms.send job completed");
  });

  sendWorker.on("failed", (job, err) => {
    recordQueueJob("sms.send", "failed");
    logger.error({ jobId: job?.id, error: err }, "sms.send job failed");
  });

  return { composeWorker, sendWorker };
}

export async function stopSmsWorkers(workers: ReturnType<typeof createSmsWorkers>) {
  await workers.composeWorker.close();
  await workers.sendWorker.close();
  logger.info("SMS workers stopped");
}

