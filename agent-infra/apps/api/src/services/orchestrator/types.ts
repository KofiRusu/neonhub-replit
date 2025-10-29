import type { StepJob } from "@agent-infra/job-types";
import type { WorkflowDag } from "@agent-infra/workflow-dag";

export type { WorkflowDag };

export interface OrchestrateRequest {
  workspaceSlug: string;
  workflowName: string;
  input?: Record<string, unknown>;
  trigger?: "manual" | "schedule" | "webhook";
  idempotencyKey?: string;
}

export interface OrchestrateResponse {
  runId: string;
  status: "queued" | "running" | "completed";
  workflowId: string;
  workspaceId: string;
  stepsEnqueued: StepJob[];
}
