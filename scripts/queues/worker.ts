import { Worker } from "bullmq";
import { connection } from "./index.js";
import { processContentGeneration } from "./processors/contentGeneration.js";

// Content generation worker
const contentWorker = new Worker("content-generation", processContentGeneration, {
  connection,
  concurrency: 3
});

contentWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

contentWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log("Queue workers started");
console.log("- Content generation worker: ready");

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down workers...");
  await contentWorker.close();
  console.log("Workers closed");
  process.exit(0);
});