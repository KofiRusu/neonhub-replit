import pino from 'pino';
import {
  OrchestratorPlan,
  PlanStep,
  ExecutionResult,
  StepResult,
  PolicyHook,
} from './types.js';
import { CapabilityRegistry } from './capability-registry.js';
import { PlanReplay } from './plan-replay.js';

const logger = pino({ name: 'executor' });

export interface ExecutorOptions {
  parallelExecution?: boolean;
  stopOnError?: boolean;
  policyHooks?: PolicyHook[];
}

/**
 * Executes orchestrator plans
 */
export class Executor {
  constructor(
    private capabilityRegistry: CapabilityRegistry,
    private planReplay?: PlanReplay,
    private options: ExecutorOptions = {}
  ) {}

  /**
   * Execute a plan
   */
  async execute(
    plan: OrchestratorPlan,
    context: Record<string, unknown> = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    logger.info({ planId: plan.id, steps: plan.steps.length }, 'Executing plan');

    // Record execution started
    await this.planReplay?.record(plan.id, 'execution_started', { context });

    const stepResults: StepResult[] = plan.steps.map((step) => ({
      stepId: step.id,
      status: 'pending',
    }));

    const result: ExecutionResult = {
      planId: plan.id,
      status: 'running',
      steps: stepResults,
      metadata: {
        totalDuration: 0,
        totalCost: 0,
        totalSteps: plan.steps.length,
        completedSteps: 0,
        failedSteps: 0,
      },
      startedAt: new Date().toISOString(),
    };

    try {
      // Execute steps
      if (this.options.parallelExecution) {
        await this.executeParallel(plan, stepResults, context);
      } else {
        await this.executeSequential(plan, stepResults, context);
      }

      // Check final status
      result.status = stepResults.every((s) => s.status === 'completed') ? 'completed' : 'failed';
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Plan execution failed');
      result.status = 'failed';
      result.error = (error as Error).message;
    }

    // Finalize result
    result.completedAt = new Date().toISOString();
    result.metadata.totalDuration = Date.now() - startTime;
    result.metadata.completedSteps = stepResults.filter((s) => s.status === 'completed').length;
    result.metadata.failedSteps = stepResults.filter((s) => s.status === 'failed').length;

    // Record execution completed
    await this.planReplay?.record(plan.id, 'execution_completed', result);

    logger.info({
      planId: plan.id,
      status: result.status,
      duration: result.metadata.totalDuration,
    }, 'Plan execution completed');

    return result;
  }

  /**
   * Execute steps sequentially
   */
  private async executeSequential(
    plan: OrchestratorPlan,
    stepResults: StepResult[],
    context: Record<string, unknown>
  ): Promise<void> {
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const result = await this.executeStep(step, stepResults, context);

      stepResults[i] = result;

      if (result.status === 'failed' && this.options.stopOnError) {
        logger.warn({ stepId: step.id }, 'Stopping execution due to failure');
        break;
      }
    }
  }

  /**
   * Execute steps in parallel (respecting dependencies)
   */
  private async executeParallel(
    plan: OrchestratorPlan,
    stepResults: StepResult[],
    context: Record<string, unknown>
  ): Promise<void> {
    // Build dependency graph
    const completed = new Set<string>();
    const running = new Map<string, Promise<StepResult>>();

    while (completed.size < plan.steps.length) {
      // Find steps ready to execute
      const ready = plan.steps.filter((step) => {
        const index = plan.steps.findIndex((s) => s.id === step.id);
        return (
          stepResults[index].status === 'pending' &&
          step.dependencies.every((depId) => completed.has(depId)) &&
          !running.has(step.id)
        );
      });

      if (ready.length === 0 && running.size === 0) {
        // No more steps can execute
        break;
      }

      // Start executing ready steps
      for (const step of ready) {
        const promise = this.executeStep(step, stepResults, context);
        running.set(step.id, promise);

        // Handle completion
        promise.then((result) => {
          const index = plan.steps.findIndex((s) => s.id === step.id);
          stepResults[index] = result;
          completed.add(step.id);
          running.delete(step.id);
        });
      }

      // Wait for at least one to complete
      if (running.size > 0) {
        await Promise.race(Array.from(running.values()));
      }
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: PlanStep,
    stepResults: StepResult[],
    context: Record<string, unknown>
  ): Promise<StepResult> {
    const startTime = Date.now();

    logger.info({ stepId: step.id, type: step.type, name: step.name }, 'Executing step');

    const result: StepResult = {
      stepId: step.id,
      status: 'running',
      startedAt: new Date().toISOString(),
    };

    // Record step started
    await this.planReplay?.record(step.id, 'step_started', { step });

    try {
      // Policy pre-execution hooks
      const policyCheck = await this.runPreExecutionHooks(step, context);
      if (!policyCheck.allow) {
        result.status = 'skipped';
        result.error = policyCheck.reason || 'Blocked by policy';
        logger.warn({ stepId: step.id, reason: result.error }, 'Step skipped by policy');
        return result;
      }

      // Get capability
      const capability = this.capabilityRegistry.get(step.name);
      if (!capability) {
        throw new Error(`Capability not found: ${step.name}`);
      }

      // Execute with timeout
      const output = await this.withTimeout(
        this.executeCapability(capability, step.params, context),
        step.timeout || 60000
      );

      result.status = 'completed';
      result.output = output;
      result.duration = Date.now() - startTime;
      result.completedAt = new Date().toISOString();

      // Policy post-execution hooks
      await this.runPostExecutionHooks(step, result, context);

      // Record step completed
      await this.planReplay?.record(step.id, 'step_completed', result);

      logger.info({ stepId: step.id, duration: result.duration }, 'Step completed');
    } catch (error) {
      result.status = 'failed';
      result.error = (error as Error).message;
      result.duration = Date.now() - startTime;
      result.completedAt = new Date().toISOString();

      // Record step failed
      await this.planReplay?.record(step.id, 'step_failed', result);

      logger.error({ stepId: step.id, error: result.error }, 'Step failed');
    }

    return result;
  }

  /**
   * Execute a capability
   */
  private async executeCapability(
    capability: any,
    params: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<unknown> {
    // In production, integrate with ToolRunner or agent execution
    logger.info({ capability: capability.name }, 'Executing capability');

    // Placeholder: simulate execution
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      result: `Executed ${capability.name} with params`,
    };
  }

  /**
   * Execute with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Run pre-execution policy hooks
   */
  private async runPreExecutionHooks(
    step: PlanStep,
    context: Record<string, unknown>
  ): Promise<{ allow: boolean; reason?: string }> {
    if (!this.options.policyHooks) {
      return { allow: true };
    }

    for (const hook of this.options.policyHooks) {
      if (hook.preExecution) {
        const result = await hook.preExecution(step, context);
        if (!result.allow) {
          return result;
        }
      }
    }

    return { allow: true };
  }

  /**
   * Run post-execution policy hooks
   */
  private async runPostExecutionHooks(
    step: PlanStep,
    result: StepResult,
    context: Record<string, unknown>
  ): Promise<void> {
    if (!this.options.policyHooks) {
      return;
    }

    for (const hook of this.options.policyHooks) {
      if (hook.postExecution) {
        await hook.postExecution(step, result, context);
      }
    }
  }
}

