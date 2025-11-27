import { Worker, Job } from "bullmq";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { Resend } from "resend";
import { recordQueueJob } from "../../lib/metrics.js";

const resend = new Resend(env.RESEND_API_KEY);

interface EmailComposePayload {
  personId: string;
  objective: string;
  brandId: string;
  operatorId?: string;
}

interface EmailSendPayload {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  metadata?: Record<string, unknown>;
}

async function processEmailCompose(job: Job<EmailComposePayload>) {
  logger.info({ jobId: job.id, personId: job.data.personId }, "Processing email.compose job");
  
  // Composition logic would use BrandVoiceService.compose() here
  // For now, we acknowledge the job
  
  return {
    composed: true,
    personId: job.data.personId,
    objective: job.data.objective,
  };
}

async function processEmailSend(job: Job<EmailSendPayload>) {
  logger.info({ jobId: job.id, to: job.data.to }, "Processing email.send job");
  
  try {
    const result = await resend.emails.send({
      from: job.data.from ?? "noreply@neonhub.ai",
      to: job.data.to,
      subject: job.data.subject,
      html: job.data.html,
      text: job.data.text,
      replyTo: job.data.replyTo,
    });

    logger.info({ jobId: job.id, emailId: result.data?.id }, "Email sent successfully");

    return {
      sent: true,
      emailId: result.data?.id,
      to: job.data.to,
    };
  } catch (error) {
    logger.error({ jobId: job.id, error, to: job.data.to }, "Failed to send email");
    throw error;
  }
}

export function createEmailWorkers() {
  const redisUrl = env.REDIS_URL ?? "redis://localhost:6379";
  const connection = { url: redisUrl };

  const composeWorker = new Worker("email.compose", processEmailCompose, {
    connection,
    concurrency: 5,
  });

  const sendWorker = new Worker("email.send", processEmailSend, {
    connection,
    concurrency: 10,
  });

  composeWorker.on("completed", (job) => {
    recordQueueJob("email.compose", "completed");
    logger.debug({ jobId: job.id }, "email.compose job completed");
  });

  composeWorker.on("failed", (job, err) => {
    recordQueueJob("email.compose", "failed");
    logger.error({ jobId: job?.id, error: err }, "email.compose job failed");
  });

  sendWorker.on("completed", (job) => {
    recordQueueJob("email.send", "completed");
    logger.debug({ jobId: job.id }, "email.send job completed");
  });

  sendWorker.on("failed", (job, err) => {
    recordQueueJob("email.send", "failed");
    logger.error({ jobId: job?.id, error: err }, "email.send job failed");
  });

  return { composeWorker, sendWorker };
}

export async function stopEmailWorkers(workers: ReturnType<typeof createEmailWorkers>) {
  await workers.composeWorker.close();
  await workers.sendWorker.close();
  logger.info("Email workers stopped");
}

