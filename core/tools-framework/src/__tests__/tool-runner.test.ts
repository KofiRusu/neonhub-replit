import { describe, it, expect, beforeEach } from '@jest/globals';
import { z } from 'zod';
import { ToolRunner } from '../tool-runner.js';
import { ToolContract } from '../types.js';

describe('ToolRunner', () => {
  let runner: ToolRunner;

  beforeEach(() => {
    runner = new ToolRunner();
  });

  const simpleTool: ToolContract<{ value: number }, { doubled: number }> = {
    metadata: {
      name: 'double',
      description: 'Double a number',
      version: '1.0.0',
    },
    inputSchema: z.object({
      value: z.number(),
    }),
    outputSchema: z.object({
      doubled: z.number(),
    }),
    async execute(input) {
      return { doubled: input.value * 2 };
    },
  };

  it('should execute tool successfully', async () => {
    const result = await runner.execute(simpleTool, { value: 5 });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ doubled: 10 });
    expect(result.metadata.duration).toBeGreaterThan(0);
    expect(result.metadata.retries).toBe(0);
  });

  it('should validate input schema', async () => {
    const result = await runner.execute(simpleTool, { value: 'invalid' } as any);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Input validation failed');
  });

  it('should handle tool errors', async () => {
    const errorTool: ToolContract<{ value: number }, { result: number }> = {
      ...simpleTool,
      async execute() {
        throw new Error('Tool failed');
      },
    };

    const result = await runner.execute(errorTool, { value: 5 });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Tool failed');
  });

  it('should retry on failure', async () => {
    let attempts = 0;
    const flakeyTool: ToolContract<{ value: number }, { result: number }> = {
      ...simpleTool,
      outputSchema: z.object({ result: z.number() }),
      async execute(input) {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { result: input.value };
      },
    };

    const result = await runner.execute(flakeyTool, { value: 5 }, { maxRetries: 3 });

    expect(result.success).toBe(true);
    expect(result.metadata.retries).toBe(2);
    expect(attempts).toBe(3);
  });

  it('should respect timeout', async () => {
    const slowTool: ToolContract<{ value: number }, { result: number }> = {
      ...simpleTool,
      outputSchema: z.object({ result: z.number() }),
      async execute(input) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return { result: input.value };
      },
    };

    const result = await runner.execute(slowTool, { value: 5 }, { timeout: 1000, maxRetries: 1 });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Timeout');
  }, 10000);

  it('should track budget', async () => {
    const result = await runner.execute(
      simpleTool,
      { value: 5 },
      {
        budget: {
          maxCost: 1.0,
          maxTokens: 1000,
          maxTime: 10000,
        },
      }
    );

    expect(result.success).toBe(true);
    expect(result.metadata.cost).toBeDefined();
    expect(result.metadata.tokens).toBeDefined();
  });

  it('should execute batch', async () => {
    const results = await runner.executeBatch(
      [simpleTool, simpleTool, simpleTool],
      [{ value: 1 }, { value: 2 }, { value: 3 }]
    );

    expect(results).toHaveLength(3);
    expect(results[0].data).toEqual({ doubled: 2 });
    expect(results[1].data).toEqual({ doubled: 4 });
    expect(results[2].data).toEqual({ doubled: 6 });
  });

  it('should execute sequence', async () => {
    const results = await runner.executeSequence(
      [simpleTool, simpleTool],
      [{ value: 5 }, { value: 10 }]
    );

    expect(results).toHaveLength(2);
    expect(results[0].data).toEqual({ doubled: 10 });
    expect(results[1].data).toEqual({ doubled: 20 });
  });
});

