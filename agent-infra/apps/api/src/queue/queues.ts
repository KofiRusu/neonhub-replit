import { Queue } from "bullmq";
import { STEP_QUEUE_NAME, STEP_DLQ_NAME, type StepJob } from "@agent-infra/job-types";
import { getRedisConnection } from "./connection.js";

const connection = getRedisConnection();

export const stepsQueue = new Queue<StepJob>(STEP_QUEUE_NAME, {
  connection
});

export const stepsDlqQueue = new Queue<StepJob>(STEP_DLQ_NAME, {
  connection
});
