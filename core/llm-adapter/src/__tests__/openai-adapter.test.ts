import { describe, it, expect, beforeEach } from '@jest/globals';
import { OpenAIAdapter } from '../openai-adapter.js';
import { ChatRequest } from '../types.js';

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;

  beforeEach(() => {
    adapter = new OpenAIAdapter({
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
      enableCostTracking: true,
      enableCircuitBreaker: true,
    });
  });

  it('should create adapter instance', () => {
    expect(adapter).toBeDefined();
    expect(adapter.getName()).toBe('openai');
  });

  it('should track circuit breaker status', () => {
    const status = adapter.getCircuitBreakerStatus();
    expect(status).toBeDefined();
    expect(status?.state).toBe('CLOSED');
  });

  it('should generate cost report', () => {
    const report = adapter.getCostReport();
    expect(report).toContain('LLM Cost Report');
  });

  // Integration test - only runs if OPENAI_API_KEY is set
  if (process.env.OPENAI_API_KEY) {
    it('should make real chat completion', async () => {
      const request: ChatRequest = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Say "Hello, world!" and nothing else.' },
        ],
        temperature: 0.7,
        maxTokens: 50,
      };

      const response = await adapter.chat(request, { timeout: 30000 });

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.usage).toBeDefined();
      expect(response.usage?.totalTokens).toBeGreaterThan(0);
      expect(response.model).toContain('gpt');

      // Check cost tracking
      const costTracker = adapter.getCostTracker();
      expect(costTracker?.getTotalCost()).toBeGreaterThan(0);
    }, 30000);

    it('should make real embeddings call', async () => {
      const embeddings = await adapter.embed({
        texts: ['Hello, world!', 'Testing embeddings'],
        model: 'text-embedding-ada-002',
      });

      expect(embeddings).toBeDefined();
      expect(embeddings.length).toBe(2);
      expect(embeddings[0].length).toBeGreaterThan(0);
    }, 30000);

    it('should handle streaming', async () => {
      const request: ChatRequest = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Count from 1 to 5.' },
        ],
        temperature: 0.7,
      };

      const chunks: string[] = [];
      for await (const delta of adapter.stream!(request)) {
        if (delta.delta) {
          chunks.push(delta.delta);
        }
      }

      expect(chunks.length).toBeGreaterThan(0);
      const fullText = chunks.join('');
      expect(fullText).toBeTruthy();
    }, 30000);
  }
});

