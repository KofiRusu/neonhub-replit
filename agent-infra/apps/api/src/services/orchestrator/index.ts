import { RunStatus, StepStatus, TriggerKind } from "@prisma/client";
import type { StepJob } from "@agent-infra/job-types";
import { getInitialNodeIds, validateDag, type WorkflowDag } from "@agent-infra/workflow-dag";
import { prisma } from "../../db/prisma.js";
import { logger } from "../../lib/logger.js";
import { stepsQueue } from "../../queue/queues.js";
import { runsStarted, runsFailed, stepsEnqueued } from "../../metrics.js";
import type { OrchestrateRequest, OrchestrateResponse } from "./types.js";

function toTriggerKind(value?: OrchestrateRequest["trigger"]): TriggerKind {
  switch (value) {
    case "schedule":
      return TriggerKind.schedule;
    case "webhook":
      return TriggerKind.webhook;
    case "manual":
    default:
      return TriggerKind.manual;
  }
}

function toResponseStatus(status: RunStatus): "queued" | "running" | "completed" {
  switch (status) {
    case RunStatus.running:
      return "running";
    case RunStatus.completed:
      return "completed";
    default:
      return "queued";
  }
}

export async function orchestrate(req: OrchestrateRequest): Promise<OrchestrateResponse> {
  logger.info({ workspace: req.workspaceSlug, workflow: req.workflowName }, "Orchestrating workflow run");

  const trigger = toTriggerKind(req.trigger);

  const result = await prisma.$transaction(async tx => {
    const workspace = await tx.workspace.findUnique({
      where: { slug: req.workspaceSlug }
    });

    if (!workspace) {
      throw new Error(`Workspace not found: ${req.workspaceSlug}`);
    }

    const workflow = await tx.workflow.findUnique({
      where: { workspaceId_name: { workspaceId: workspace.id, name: req.workflowName } },
      include: {
        latestVersion: true
      }
    });

    if (!workflow || !workflow.latestVersion) {
      throw new Error(`Workflow not found or lacks published version: ${req.workflowName}`);
    }

    const dag = workflow.latestVersion.dagJson as unknown as WorkflowDag;
    validateDag(dag);
    const initialNodeIds = getInitialNodeIds(dag);

    if (req.idempotencyKey) {
      const existingKey = await tx.idempotencyKey.findUnique({ where: { key: req.idempotencyKey } });
      if (existingKey) {
        const existingRun = await tx.agentRun.findUnique({
          where: { id: existingKey.resourceId },
          include: { steps: true }
        });
        if (existingRun) {
          return {
            run: existingRun,
            steps: existingRun.steps,
            workspace,
            workflow,
            dag,
            reused: true
          } as const;
        }
      }
    }

    const run = await tx.agentRun.create({
      data: {
        workflowId: workflow.id,
        versionId: workflow.latestVersion.id,
        workspaceId: workspace.id,
        status: initialNodeIds.length > 0 ? RunStatus.running : RunStatus.completed,
        trigger,
        input: req.input ?? {},
        startedAt: initialNodeIds.length > 0 ? new Date() : null,
        endedAt: initialNodeIds.length > 0 ? null : new Date(),
        idempotencyKey: req.idempotencyKey
      }
    });

    if (req.idempotencyKey) {
      await tx.idempotencyKey.create({
        data: {
          key: req.idempotencyKey,
          scope: "run",
          resourceId: run.id
        }
      });
    }

    const nodeMap = new Map(dag.nodes.map(node => [node.id, node]));

    const steps = await Promise.all(
      initialNodeIds.map(nodeId => {
        const node = nodeMap.get(nodeId);
        if (!node) {
          throw new Error(`Initial node ${nodeId} not found in DAG`);
        }
        return tx.runStep.create({
          data: {
            runId: run.id,
            nodeId: node.id,
            type: node.type,
            status: StepStatus.ready,
            attempt: 0,
            maxAttempts: 3,
            input: {
              payload: req.input ?? {},
              config: node.config ?? {}
            }
          }
        });
      })
    );

    if (steps.length === 0) {
      await tx.agentRun.update({
        where: { id: run.id },
        data: {
          status: RunStatus.completed,
          endedAt: new Date(),
          output: {}
        }
      });
    }

    return { run, steps, workspace, workflow, dag, reused: false } as const;
  }, { timeout: 20_000 }).catch(error => {
    runsFailed.inc();
    logger.error({ error }, "Failed to orchestrate workflow run");
    throw error;
  });

  const { run, steps, dag, reused } = result;

  if (reused) {
    logger.info({ runId: run.id }, "Idempotent request: returning existing run");
    return {
      runId: run.id,
      status: toResponseStatus(run.status),
      workflowId: run.workflowId,
      workspaceId: run.workspaceId,
      stepsEnqueued: []
    };
  }

  runsStarted.inc();

  const nodeMap = new Map((dag.nodes ?? []).map(node => [node.id, node]));

  const enqueuedJobs: StepJob[] = [];

  try {
    for (const step of steps) {
      const node = nodeMap.get(step.nodeId);
      if (!node) {
        logger.warn({ stepId: step.id, nodeId: step.nodeId }, "Skipping enqueue for missing node definition");
        continue;
      }
      const job: StepJob = {
        runId: run.id,
        stepId: step.id,
        workflowId: run.workflowId,
        workspaceId: run.workspaceId,
        nodeId: node.id,
        connector: node.connector,
        action: node.action,
        payload: {
          input: step.input,
          config: node.config ?? {}
        },
        idempotencyKey: `${step.id}:attempt:${step.attempt}`
      };

      await stepsQueue.add(step.id, job, {
        jobId: `${step.id}:0`,
        removeOnComplete: true,
        removeOnFail: false
      });
      enqueuedJobs.push(job);
      stepsEnqueued.inc();
    }
  } catch (error) {
    runsFailed.inc();
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: RunStatus.failed,
        error: { message: error instanceof Error ? error.message : "enqueue_failed" },
        endedAt: new Date()
      }
    });
    logger.error({ error, runId: run.id }, "Failed to enqueue steps");
    throw error;
  }

  logger.info({ runId: run.id, stepCount: enqueuedJobs.length }, "Workflow run enqueued");

  return {
    runId: run.id,
    status: toResponseStatus(run.status),
    workflowId: run.workflowId,
    workspaceId: run.workspaceId,
    stepsEnqueued: enqueuedJobs
  };
}
