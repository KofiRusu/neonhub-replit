import type { HTTPClient } from '../client';
import type { OrchestrationInput, OrchestrationResult } from '../types';

/**
 * Orchestration operations
 */
export class OrchestrationModule {
  constructor(private client: HTTPClient) {}

  /**
   * Execute orchestration workflow
   */
  async execute(input: OrchestrationInput): Promise<OrchestrationResult> {
    return this.client.post<OrchestrationResult>('/orchestrate', { body: input });
  }

  /**
   * Get orchestration run status
   */
  async getStatus(runId: string): Promise<OrchestrationResult> {
    return this.client.get<OrchestrationResult>(`/orchestration/${runId}`);
  }

  /**
   * List orchestration runs
   */
  async listRuns(params?: {
    workflow?: string;
    status?: string;
    limit?: number;
  }): Promise<OrchestrationResult[]> {
    return this.client.get<OrchestrationResult[]>('/orchestration', { query: params });
  }

  /**
   * Wait for orchestration completion
   */
  async waitForCompletion(runId: string, options?: {
    timeout?: number;
    pollInterval?: number;
  }): Promise<OrchestrationResult> {
    const timeout = options?.timeout || 120000; // 2 minutes default
    const pollInterval = options?.pollInterval || 3000; // 3s default
    const startTime = Date.now();

    while (true) {
      const result = await this.getStatus(runId);
      
      if (result.status === 'completed' || result.status === 'failed') {
        return result;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(`Orchestration ${runId} did not complete within ${timeout}ms`);
      }

      await this.sleep(pollInterval);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

