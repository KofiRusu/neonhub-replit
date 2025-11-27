import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import { OrchestratorGoal, OrchestratorPlan, PlanStep } from './types.js';
import { CapabilityRegistry } from './capability-registry.js';

const logger = pino({ name: 'planner' });

export interface PlannerOptions {
  maxSteps?: number;
  estimateCosts?: boolean;
}

/**
 * Plans multi-step workflows to achieve goals
 */
export class Planner {
  constructor(
    private capabilityRegistry: CapabilityRegistry,
    private options: PlannerOptions = {}
  ) {}

  /**
   * Create a plan to achieve a goal
   */
  async plan(goal: OrchestratorGoal): Promise<OrchestratorPlan> {
    logger.info({ goalId: goal.id, description: goal.description }, 'Creating plan');

    const steps = await this.decomposeGoal(goal);

    const plan: OrchestratorPlan = {
      id: `plan_${uuidv4()}`,
      goalId: goal.id,
      steps,
      estimatedDuration: this.estimateDuration(steps),
      estimatedCost: this.options.estimateCosts ? this.estimateCost(steps) : undefined,
      createdAt: new Date().toISOString(),
    };

    logger.info({
      planId: plan.id,
      steps: steps.length,
      estimatedDuration: plan.estimatedDuration,
    }, 'Plan created');

    return plan;
  }

  /**
   * Decompose goal into executable steps
   * In production, this would use an LLM to intelligently plan
   */
  private async decomposeGoal(goal: OrchestratorGoal): Promise<PlanStep[]> {
    const steps: PlanStep[] = [];

    // Simple heuristic-based planning (placeholder)
    // In production, use LLM with capability registry for intelligent planning

    const capabilities = this.capabilityRegistry.listEnabled();
    logger.info({ capabilities: capabilities.length }, 'Available capabilities');

    // Example: Create a simple linear plan
    // Real implementation would use LLM to reason about goal and capabilities

    if (goal.description.toLowerCase().includes('content')) {
      steps.push({
        id: `step_${uuidv4()}`,
        type: 'agent',
        name: 'content_generation',
        description: 'Generate content using content agent',
        params: {
          topic: goal.context?.topic || 'default',
          type: goal.context?.type || 'blog',
        },
        dependencies: [],
        timeout: 60000,
        retries: 3,
      });
    }

    if (goal.description.toLowerCase().includes('seo')) {
      steps.push({
        id: `step_${uuidv4()}`,
        type: 'agent',
        name: 'seo_optimization',
        description: 'Optimize for SEO',
        params: {
          keywords: goal.context?.keywords || [],
        },
        dependencies: steps.length > 0 ? [steps[steps.length - 1].id] : [],
        timeout: 30000,
        retries: 2,
      });
    }

    // Add default step if no steps generated
    if (steps.length === 0) {
      steps.push({
        id: `step_${uuidv4()}`,
        type: 'llm',
        name: 'general_task',
        description: 'Execute task using LLM',
        params: {
          prompt: goal.description,
        },
        dependencies: [],
        timeout: 45000,
        retries: 3,
      });
    }

    return steps;
  }

  /**
   * Estimate total duration
   */
  private estimateDuration(steps: PlanStep[]): number {
    return steps.reduce((total, step) => total + (step.timeout || 30000), 0);
  }

  /**
   * Estimate total cost
   */
  private estimateCost(steps: PlanStep[]): number {
    // Simple heuristic: $0.01 per step
    return steps.length * 0.01;
  }

  /**
   * Validate plan before execution
   */
  async validatePlan(plan: OrchestratorPlan): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for circular dependencies
    const hasCircular = this.hasCircularDependencies(plan.steps);
    if (hasCircular) {
      errors.push('Plan contains circular dependencies');
    }

    // Check max steps limit
    const maxSteps = this.options.maxSteps || 100;
    if (plan.steps.length > maxSteps) {
      errors.push(`Plan exceeds maximum steps limit (${maxSteps})`);
    }

    // Validate each step
    for (const step of plan.steps) {
      // Check dependencies exist
      for (const depId of step.dependencies) {
        if (!plan.steps.find((s) => s.id === depId)) {
          errors.push(`Step ${step.id} has invalid dependency: ${depId}`);
        }
      }

      // Check capability exists
      const capability = this.capabilityRegistry.get(step.name);
      if (!capability) {
        errors.push(`Step ${step.id} references unknown capability: ${step.name}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for circular dependencies
   */
  private hasCircularDependencies(steps: PlanStep[]): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      visited.add(stepId);
      recStack.add(stepId);

      const step = steps.find((s) => s.id === stepId);
      if (!step) return false;

      for (const depId of step.dependencies) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) return true;
        } else if (recStack.has(depId)) {
          return true;
        }
      }

      recStack.delete(stepId);
      return false;
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        if (hasCycle(step.id)) return true;
      }
    }

    return false;
  }

  /**
   * Re-plan after failure
   */
  async replan(
    originalPlan: OrchestratorPlan,
    failedStepId: string,
    error: string
  ): Promise<OrchestratorPlan> {
    logger.info({ planId: originalPlan.id, failedStepId }, 'Re-planning after failure');

    // Simple re-planning: remove failed step and continue
    // In production, use LLM to intelligently adjust plan

    const steps = originalPlan.steps.filter((s) => s.id !== failedStepId);

    const newPlan: OrchestratorPlan = {
      id: `plan_${uuidv4()}`,
      goalId: originalPlan.goalId,
      steps,
      estimatedDuration: this.estimateDuration(steps),
      estimatedCost: this.options.estimateCosts ? this.estimateCost(steps) : undefined,
      createdAt: new Date().toISOString(),
    };

    logger.info({ newPlanId: newPlan.id }, 'Re-plan created');
    return newPlan;
  }
}

