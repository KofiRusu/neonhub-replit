import type { HTTPClient } from '../client';
import type { OrchestrationInput, OrchestrationResult } from '../types';
import { OrchestratorRequestSchema, OrchestratorResponseSchema } from '@neonhub/orchestrator-contract';

/**
 * Orchestration operations
 *
 * Phase 4 alignment:
 * - Accept shared contract requests (intent + optional agent/context).
 * - POST to `/orchestrate` and validate the envelope using the shared schema.
 * - Provide a helper so callers can just pass an intent + payload without building the full request object.
 */
export class OrchestrationModule {
  constructor(private client: HTTPClient) {}

  /**
   * Execute orchestration with a fully specified request payload.
   */
  async execute(input: OrchestrationInput): Promise<OrchestrationResult> {
    const payload = OrchestratorRequestSchema.parse(input);
    const response = await this.client.post('/orchestrate', { body: payload });
    return OrchestratorResponseSchema.parse(response);
  }

  /**
   * Convenience helper for intent-heavy flows.
   */
  async executeIntent(
    intent: string,
    payload?: unknown,
    options?: { agent?: string; context?: OrchestrationInput['context'] },
  ): Promise<OrchestrationResult> {
    return this.execute({
      intent,
      payload,
      agent: options?.agent,
      context: options?.context,
    });
  }
}
