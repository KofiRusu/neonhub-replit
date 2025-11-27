import { z } from 'zod';

/**
 * Orchestration goal
 */
export const OrchestratorGoalSchema = z.object({
  id: z.string(),
  description: z.string(),
  success_criteria: z.array(z.string()),
  constraints: z.record(z.unknown()).optional(),
  context: z.record(z.unknown()).optional(),
});

export type OrchestratorGoal = z.infer<typeof OrchestratorGoalSchema>;

/**
 * Plan step
 */
export const PlanStepSchema = z.object({
  id: z.string(),
  type: z.enum(['tool', 'agent', 'llm', 'wait', 'conditional']),
  name: z.string(),
  description: z.string(),
  params: z.record(z.unknown()),
  dependencies: z.array(z.string()).default([]),
  timeout: z.number().optional(),
  retries: z.number().optional(),
});

export type PlanStep = z.infer<typeof PlanStepSchema>;

/**
 * Orchestrator plan
 */
export const OrchestratorPlanSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  steps: z.array(PlanStepSchema),
  estimatedDuration: z.number().optional(),
  estimatedCost: z.number().optional(),
  createdAt: z.string().datetime(),
});

export type OrchestratorPlan = z.infer<typeof OrchestratorPlanSchema>;

/**
 * Execution step result
 */
export const StepResultSchema = z.object({
  stepId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']),
  output: z.unknown().optional(),
  error: z.string().optional(),
  duration: z.number().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

export type StepResult = z.infer<typeof StepResultSchema>;

/**
 * Execution result
 */
export const ExecutionResultSchema = z.object({
  planId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  steps: z.array(StepResultSchema),
  output: z.unknown().optional(),
  error: z.string().optional(),
  metadata: z.object({
    totalDuration: z.number(),
    totalCost: z.number().optional(),
    totalSteps: z.number(),
    completedSteps: z.number(),
    failedSteps: z.number(),
  }),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

/**
 * Capability definition
 */
export const CapabilitySchema = z.object({
  name: z.string(),
  type: z.enum(['tool', 'agent', 'service']),
  description: z.string(),
  inputSchema: z.any(),
  outputSchema: z.any(),
  enabled: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export type Capability = z.infer<typeof CapabilitySchema>;

/**
 * Policy hook
 */
export interface PolicyHook {
  name: string;
  preExecution?: (step: PlanStep, context: any) => Promise<{ allow: boolean; reason?: string }>;
  postExecution?: (step: PlanStep, result: StepResult, context: any) => Promise<void>;
}

/**
 * Plan replay entry
 */
export const PlanReplayEntrySchema = z.object({
  id: z.string(),
  planId: z.string(),
  timestamp: z.string().datetime(),
  event: z.enum(['plan_created', 'execution_started', 'step_started', 'step_completed', 'step_failed', 'execution_completed', 'execution_failed']),
  data: z.unknown(),
});

export type PlanReplayEntry = z.infer<typeof PlanReplayEntrySchema>;

