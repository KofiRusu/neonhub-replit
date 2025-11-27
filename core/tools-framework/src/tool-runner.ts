import pino from 'pino';
import { z } from 'zod';
import {
  ToolContract,
  ToolExecutionOpts,
  ToolExecutionResult,
  ToolExecutionOptsSchema,
} from './types.js';
import { BudgetTrackerImpl } from './budget-tracker.js';

const logger = pino({ name: 'tool-runner' });

/**
 * Executes tools with timeout, retry, and budget controls
 */
export class ToolRunner {
  /**
   * Execute a tool with full error handling and budget tracking
   */
  async execute<TInput, TOutput>(
    contract: ToolContract<TInput, TOutput>,
    input: TInput,
    opts: Partial<ToolExecutionOpts> = {}
  ): Promise<ToolExecutionResult> {
    const fullOpts = this.mergeOpts(opts);
    const startTime = Date.now();
    let retries = 0;
    let lastError: Error | null = null;

    // Validate input
    try {
      contract.inputSchema.parse(input);
    } catch (error) {
      logger.error({ tool: contract.metadata.name, error: (error as Error).message }, 'Input validation failed');
      return {
        success: false,
        error: `Input validation failed: ${(error as Error).message}`,
        metadata: {
          duration: Date.now() - startTime,
          retries: 0,
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Create budget tracker if needed
    const budgetTracker = fullOpts.budget ? new BudgetTrackerImpl(fullOpts.budget) : undefined;

    // Execute with retries
    for (let attempt = 1; attempt <= fullOpts.maxRetries; attempt++) {
      // Check budget before execution
      if (budgetTracker && !budgetTracker.canExecute()) {
        return {
          success: false,
          error: 'Budget exceeded',
          metadata: {
            duration: Date.now() - startTime,
            retries,
            cost: budgetTracker.consumed.cost,
            tokens: budgetTracker.consumed.tokens,
          },
          timestamp: new Date().toISOString(),
        };
      }

      try {
        logger.info({ tool: contract.metadata.name, attempt }, 'Executing tool');

        const attemptStart = Date.now();
        const result = await this.withTimeout(
          contract.execute(input, fullOpts),
          fullOpts.timeout
        );

        const attemptDuration = Date.now() - attemptStart;

        // Validate output
        contract.outputSchema.parse(result);

        // Track budget (placeholder values - should be passed from tool)
        if (budgetTracker) {
          budgetTracker.track(0, 0, attemptDuration);
        }

        logger.info({
          tool: contract.metadata.name,
          duration: attemptDuration,
          retries,
        }, 'Tool executed successfully');

        return {
          success: true,
          data: result,
          metadata: {
            duration: Date.now() - startTime,
            retries,
            cost: budgetTracker?.consumed.cost,
            tokens: budgetTracker?.consumed.tokens,
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error as Error;
        retries = attempt;

        logger.warn({
          tool: contract.metadata.name,
          attempt,
          error: lastError.message,
        }, 'Tool execution failed');

        // Don't retry if aborted
        if (fullOpts.abortSignal?.aborted) {
          break;
        }

        // Don't retry on final attempt
        if (attempt >= fullOpts.maxRetries) {
          break;
        }

        // Exponential backoff
        const backoff = fullOpts.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(backoff);
      }
    }

    // All retries failed
    logger.error({
      tool: contract.metadata.name,
      error: lastError?.message,
      retries,
    }, 'Tool execution failed after all retries');

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      metadata: {
        duration: Date.now() - startTime,
        retries,
        cost: budgetTracker?.consumed.cost,
        tokens: budgetTracker?.consumed.tokens,
      },
      timestamp: new Date().toISOString(),
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
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Merge options with defaults
   */
  private mergeOpts(opts: Partial<ToolExecutionOpts>): ToolExecutionOpts {
    return ToolExecutionOptsSchema.parse(opts);
  }

  /**
   * Batch execute multiple tools
   */
  async executeBatch<TInput, TOutput>(
    contracts: ToolContract<TInput, TOutput>[],
    inputs: TInput[],
    opts: Partial<ToolExecutionOpts> = {}
  ): Promise<ToolExecutionResult[]> {
    if (contracts.length !== inputs.length) {
      throw new Error('Contracts and inputs arrays must have the same length');
    }

    logger.info({ count: contracts.length }, 'Executing tool batch');

    const promises = contracts.map((contract, index) =>
      this.execute(contract, inputs[index], opts)
    );

    return Promise.all(promises);
  }

  /**
   * Execute tools in sequence (one after another)
   */
  async executeSequence<TInput, TOutput>(
    contracts: ToolContract<TInput, TOutput>[],
    inputs: TInput[],
    opts: Partial<ToolExecutionOpts> = {}
  ): Promise<ToolExecutionResult[]> {
    if (contracts.length !== inputs.length) {
      throw new Error('Contracts and inputs arrays must have the same length');
    }

    logger.info({ count: contracts.length }, 'Executing tool sequence');

    const results: ToolExecutionResult[] = [];

    for (let i = 0; i < contracts.length; i++) {
      const result = await this.execute(contracts[i], inputs[i], opts);
      results.push(result);

      // Stop on first failure if desired
      if (!result.success && opts.context?.stopOnError) {
        logger.warn({ index: i }, 'Stopping sequence due to error');
        break;
      }
    }

    return results;
  }
}

