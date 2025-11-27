import pino from 'pino';
import { BaseModelAdapter } from './adapter.js';
import {
  ChatRequest,
  ChatResponse,
  CallOpts,
  EmbedRequest,
  Usage,
} from './types.js';
import { CircuitBreakerImpl } from './circuit-breaker.js';
import { CostTrackerImpl } from './cost-tracker.js';

const logger = pino({ name: 'zai-adapter' });

export interface ZaiAdapterConfig {
  apiKey: string;
  baseURL: string;
  enableCircuitBreaker?: boolean;
  enableCostTracking?: boolean;
}

/**
 * Zai/Custom LLM adapter
 * Implements OpenAI-compatible API interface
 */
export class ZaiAdapter extends BaseModelAdapter {
  private apiKey: string;
  private baseURL: string;
  private circuitBreaker?: CircuitBreakerImpl;
  private costTracker?: CostTrackerImpl;

  constructor(config: ZaiAdapterConfig) {
    super();

    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash

    if (config.enableCircuitBreaker !== false) {
      this.circuitBreaker = new CircuitBreakerImpl();
    }

    if (config.enableCostTracking !== false) {
      this.costTracker = new CostTrackerImpl();
    }
  }

  getName(): string {
    return 'zai';
  }

  protected async executeChat(req: ChatRequest, opts: CallOpts): Promise<ChatResponse> {
    if (this.circuitBreaker && !this.circuitBreaker.canExecute()) {
      throw new Error('Circuit breaker is OPEN - too many recent failures');
    }

    const startTime = Date.now();

    try {
      logger.info({ model: req.model, messageCount: req.messages.length }, 'Calling Zai chat API');

      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: req.model,
          messages: req.messages,
          temperature: req.temperature,
          max_tokens: req.maxTokens,
          top_p: req.topP,
          frequency_penalty: req.frequencyPenalty,
          presence_penalty: req.presencePenalty,
          stop: req.stop,
          user: req.user,
        }),
        signal: opts.abortSignal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Zai API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      const content = data.choices?.[0]?.message?.content || '';
      const usage: Usage | undefined = data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined;

      // Track cost
      if (usage && this.costTracker) {
        this.costTracker.trackUsage(req.model, usage);
      }

      // Record success
      if (this.circuitBreaker) {
        this.circuitBreaker.recordSuccess();
      }

      logger.info({
        model: data.model,
        tokens: usage?.totalTokens,
        responseTime,
      }, 'Zai chat API call successful');

      return {
        content,
        finishReason: data.choices?.[0]?.finish_reason,
        usage,
        model: data.model || req.model,
        cached: false,
        responseTime,
      };
    } catch (error) {
      if (this.circuitBreaker) {
        this.circuitBreaker.recordFailure();
      }

      logger.error({ error: (error as Error).message, model: req.model }, 'Zai chat API call failed');
      throw error;
    }
  }

  protected async executeEmbed(req: EmbedRequest, opts: CallOpts): Promise<number[][]> {
    if (this.circuitBreaker && !this.circuitBreaker.canExecute()) {
      throw new Error('Circuit breaker is OPEN - too many recent failures');
    }

    const startTime = Date.now();

    try {
      logger.info({ model: req.model, textCount: req.texts.length }, 'Calling Zai embeddings API');

      const response = await fetch(`${this.baseURL}/v1/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: req.model,
          input: req.texts,
        }),
        signal: opts.abortSignal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Zai API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      const embeddings = data.data?.map((item: any) => item.embedding) || [];

      // Track cost if usage provided
      if (data.usage && this.costTracker) {
        const usage: Usage = {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: 0,
          totalTokens: data.usage.total_tokens,
        };
        this.costTracker.trackUsage(req.model, usage);
      }

      // Record success
      if (this.circuitBreaker) {
        this.circuitBreaker.recordSuccess();
      }

      logger.info({
        model: data.model || req.model,
        embeddings: embeddings.length,
        responseTime,
      }, 'Zai embeddings API call successful');

      return embeddings;
    } catch (error) {
      if (this.circuitBreaker) {
        this.circuitBreaker.recordFailure();
      }

      logger.error({ error: (error as Error).message, model: req.model }, 'Zai embeddings API call failed');
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/v1/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Zai health check failed');
      return false;
    }
  }

  /**
   * Get cost report
   */
  getCostReport(): string {
    return this.costTracker?.getReport() || 'Cost tracking disabled';
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker?.reset();
  }

  /**
   * Reset cost tracker
   */
  resetCostTracker(): void {
    this.costTracker?.reset();
  }
}

