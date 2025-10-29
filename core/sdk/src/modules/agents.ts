import type { HTTPClient } from '../client';
import type { Agent, AgentJob, AgentExecuteInput, AgentExecuteResult, ListParams } from '../types';

/**
 * Agent operations
 */
export class AgentsModule {
  constructor(private client: HTTPClient) {}

  /**
   * List all agents
   */
  async list(params?: ListParams): Promise<Agent[]> {
    return this.client.get<Agent[]>('/agents', { query: params });
  }

  /**
   * Get agent by ID
   */
  async get(id: string): Promise<Agent> {
    return this.client.get<Agent>(`/agents/${id}`);
  }

  /**
   * Execute an agent
   */
  async execute(input: AgentExecuteInput): Promise<AgentExecuteResult> {
    return this.client.post<AgentExecuteResult>('/agents/execute', { body: input });
  }

  /**
   * Get agent job by ID
   */
  async getJob(jobId: string): Promise<AgentJob> {
    return this.client.get<AgentJob>(`/jobs/${jobId}`);
  }

  /**
   * List agent jobs
   */
  async listJobs(params?: ListParams & { agent?: string; status?: string }): Promise<AgentJob[]> {
    return this.client.get<AgentJob[]>('/jobs', { query: params });
  }

  /**
   * Wait for agent job completion
   */
  async waitForCompletion(jobId: string, options?: {
    timeout?: number;
    pollInterval?: number;
  }): Promise<AgentJob> {
    const timeout = options?.timeout || 60000; // 60s default
    const pollInterval = options?.pollInterval || 2000; // 2s default
    const startTime = Date.now();

    while (true) {
      const job = await this.getJob(jobId);
      
      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(`Job ${jobId} did not complete within ${timeout}ms`);
      }

      await this.sleep(pollInterval);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

