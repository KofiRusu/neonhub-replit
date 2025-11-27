import { Queue } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { recordQueueJob, updateQueuePending } from "../lib/metrics.js";

type QueueMap = {
  "intake.fetch": Queue;
  "intake.normalize": Queue;
  "intake.embed": Queue;
  "email.compose": Queue;
  "email.send": Queue;
  "sms.compose": Queue;
  "sms.send": Queue;
  "social.compose": Queue;
  "social.send": Queue;
  "learning.tune": Queue;
  "budget.execute": Queue;
  "seo.analytics": Queue;
};

function buildQueue(name: keyof QueueMap): Queue {
  const redisUrl = env.REDIS_URL ?? "redis://localhost:6379";
  const queue = new Queue(name, {
    connection: {
      url: redisUrl,
    },
    defaultJobOptions: {
      removeOnComplete: 200,
      removeOnFail: 500,
    },
  });

  (queue as any).on("error", (error: unknown) => {
    logger.error({ error, queue: name }, "BullMQ queue error");
  });

  return attachQueueTelemetry(queue, name);
}

export const queues: QueueMap = {
  "intake.fetch": buildQueue("intake.fetch"),
  "intake.normalize": buildQueue("intake.normalize"),
  "intake.embed": buildQueue("intake.embed"),
  "email.compose": buildQueue("email.compose"),
  "email.send": buildQueue("email.send"),
  "sms.compose": buildQueue("sms.compose"),
  "sms.send": buildQueue("sms.send"),
  "social.compose": buildQueue("social.compose"),
  "social.send": buildQueue("social.send"),
  "learning.tune": buildQueue("learning.tune"),
  "budget.execute": buildQueue("budget.execute"),
  "seo.analytics": buildQueue("seo.analytics"),
};

export type QueueName = keyof QueueMap;

function attachQueueTelemetry(queue: Queue, name: keyof QueueMap): Queue {
  const originalAdd = queue.add.bind(queue);

  queue.add = (async (...args: Parameters<typeof originalAdd>) => {
    recordQueueJob(name, "added");
    const job = await originalAdd(...args);
    try {
      const counts = await queue.getJobCounts("waiting");
      updateQueuePending(name, counts.waiting ?? 0);
    } catch {
      // no-op in mock environments
    }
    return job;
  }) as typeof queue.add;

  (queue as any).on("completed", () => recordQueueJob(name, "completed"));
  (queue as any).on("failed", () => recordQueueJob(name, "failed"));
  (queue as any).on("waiting", async () => {
    try {
      const counts = await queue.getJobCounts("waiting");
      updateQueuePending(name, counts.waiting ?? 0);
    } catch {
      // no-op in mock environments
    }
  });

  return queue;
}
