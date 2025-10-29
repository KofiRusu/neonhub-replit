import { Queue, Worker } from "bullmq";
import { STEP_QUEUE_NAME, STEP_DLQ_NAME, type StepJob } from "@agent-infra/job-types";
import { RunStatus, StepStatus } from "@prisma/client";
import { executeConnectorAction } from "@agent-infra/connector-sdk";
import { getNextReadyNodeIds, type WorkflowDag } from "@agent-infra/workflow-dag";
import { prisma } from "./db/prisma.js";
import { getRedisConnection } from "./queue/connection.js";
import { workerConfig } from "./config.js";
import { logger } from "./lib/logger.js";
import { stepsFailed, stepsStarted, stepsSucceeded } from "./metrics.js";

const connection = getRedisConnection();

const dlqQueue = new Queue<StepJob>(STEP_DLQ_NAME, { connection });

export async function processStepJob(jobData: StepJob, queue: Queue<StepJob>) {
  const { runId, stepId, connector, action, workspaceId, workflowId, nodeId } = jobData;
  stepsStarted.inc();

  try {
    const run = await prisma.agentRun.findUnique({
      where: { id: runId },
      include: {
        version: true,
        steps: true
      }
    });

    if (!run || !run.version) {
      throw new Error(`Run ${runId} not found`);
    }

    const dag = run.version.dagJson as unknown as WorkflowDag;
    await prisma.runStep.update({
      where: { id: stepId },
      data: {
        status: StepStatus.running,
        startedAt: new Date()
      }
    });

    const payload = (jobData.payload as Record<string, unknown>) ?? {};
    const connectorInput = {
      ...(payload.config as Record<string, unknown> | undefined) ?? {},
      runInput: payload.input ?? {}
    };

    const startedAt = Date.now();
    const executionResult = await executeConnectorAction(connector, action, {
      workspaceId,
      runId,
      stepId,
      credential: null,
      logger(message, meta) {
        logger.info({ runId, stepId, message, meta }, "connector_log");
      }
    }, connectorInput ?? {});

    await prisma.toolExecution.create({
      data: {
        stepId,
        connector,
        action,
        request: connectorInput ?? {},
        response: executionResult ?? null,
        durationMs: Date.now() - startedAt
      }
    });

    await prisma.runStep.update({
      where: { id: stepId },
      data: {
        status: StepStatus.succeeded,
        output: executionResult ?? {},
        endedAt: new Date()
      }
    });

    stepsSucceeded.inc();

    const allSteps = await prisma.runStep.findMany({
      where: { runId }
    });

    const completedNodeIds = new Set(
      allSteps
        .filter(existing => existing.status === StepStatus.succeeded)
        .map(existing => existing.nodeId)
    );
    completedNodeIds.add(nodeId);

    const existingNodeIds = new Set(allSteps.map(existing => existing.nodeId));

    const nextNodes = getNextReadyNodeIds({
      dag,
      completedNodeIds,
      existingNodeIds
    });

    for (const nextNodeId of nextNodes) {
      const node = dag.nodes.find(n => n.id === nextNodeId);
      if (!node) {
        continue;
      }

      try {
        const newStep = await prisma.runStep.create({
          data: {
            runId,
            nodeId: node.id,
            type: node.type,
            status: StepStatus.ready,
            attempt: 0,
            maxAttempts: 3,
            input: {
              payload: run.input ?? {},
              config: node.config ?? {}
            }
          }
        });

        await queue.add(
          newStep.id,
          {
            runId,
            stepId: newStep.id,
            workflowId,
            workspaceId,
            nodeId: node.id,
            connector: node.connector,
            action: node.action,
            payload: {
              config: node.config ?? {},
              input: run.input ?? {}
            },
            idempotencyKey: `${newStep.id}:attempt:${newStep.attempt}`
          },
          {
            jobId: `${newStep.id}:0`,
            removeOnComplete: true,
            removeOnFail: false
          }
        );
      } catch (createError) {
        logger.warn({ createError, runId, node: node.id }, "Failed to create follow-up step (maybe already exists)");
      }
    }

    const hasPendingSteps = await prisma.runStep.count({
      where: {
        runId,
        status: {
          in: [StepStatus.ready, StepStatus.running, StepStatus.retrying]
        }
      }
    });

    if (hasPendingSteps === 0) {
      await prisma.agentRun.update({
        where: { id: runId },
        data: {
          status: RunStatus.completed,
          endedAt: new Date(),
          output: executionResult ?? {}
        }
      });
    }
  } catch (error) {
    stepsFailed.inc();
    logger.error({ error, job: jobData }, "Worker failed processing step");

    await prisma.runStep.update({
      where: { id: jobData.stepId },
      data: {
        status: StepStatus.dlq,
        error: { message: error instanceof Error ? error.message : String(error) },
        endedAt: new Date()
      }
    }).catch(updateError => {
      logger.error({ updateError }, "Failed updating step to DLQ status");
    });

    await prisma.agentRun.update({
      where: { id: jobData.runId },
      data: {
        status: RunStatus.failed,
        error: { message: error instanceof Error ? error.message : String(error) },
        endedAt: new Date()
      }
    }).catch(updateError => {
      logger.error({ updateError }, "Failed updating run status after error");
    });

    await dlqQueue.add(jobData.stepId, jobData, {
      removeOnComplete: true,
      removeOnFail: false
    });

    throw error;
  }
}

export function createStepWorker() {
  return new Worker<StepJob>(
    STEP_QUEUE_NAME,
    async job => {
      await processStepJob(job.data, job.queue);
    },
    {
      connection,
      concurrency: workerConfig.concurrency
    }
  );
}

export async function startWorker() {
  const worker = createStepWorker();
  worker.on("completed", job => {
    logger.info({ jobId: job.id, runId: job.data.runId }, "Step completed");
  });
  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Step processing failed");
  });
  await worker.waitUntilReady();
  logger.info({ concurrency: workerConfig.concurrency }, "Worker ready");
  return worker;
}

export async function stopWorker(worker: Worker<StepJob>) {
  await worker.close();
  await dlqQueue.close();
  await connection.quit();
}
