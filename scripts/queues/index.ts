import { Queue, Worker } from "bullmq";

const connection = {
  url: process.env.REDIS_URL || "redis://localhost:6379"
};

// Queue for content generation tasks
export const contentQueue = new Queue("content-generation", { connection });

// Queue for agent job processing
export const agentQueue = new Queue("agent-jobs", { connection });

// Export connection config for workers
export { connection };