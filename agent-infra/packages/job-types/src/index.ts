export const STEP_QUEUE_NAME = "steps.ready" as const;
export const STEP_DLQ_NAME = "steps.dlq" as const;

export type StepJob = {
  runId: string;
  stepId: string;
  workflowId: string;
  workspaceId: string;
  nodeId: string;
  connector: string;
  action: string;
  payload: unknown;
  idempotencyKey: string;
};

export type StepResult = {
  status: "succeeded" | "failed";
  output?: unknown;
  error?: { message: string; retryable?: boolean };
};
