import OpenAI from 'openai';
import pino from 'pino';
import { withSpan, addSpanAttributes } from '@neonhub/telemetry';
import { BaseModelAdapter } from './adapter.js';
import {
  ChatRequest,
  ChatResponse,
  ChatDelta,
  CallOpts,
  EmbedRequest,
  Usage,
} from './types.js';
import { CircuitBreakerImpl } from './circuit-breaker.js';
import { CostTrackerImpl } from './cost-tracker.js';

const logger = pino({ name: 'openai-adapter' });

export interface OpenAIAdapterConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  maxRetries?: number;
  timeout?: number;
  enableCircuitBreaker?: boolean;
  enableCostTracking?: boolean;
}

/**
 * OpenAI adapter with retry, timeout, circuit breaker, and cost tracking
 */
export class OpenAIAdapter extends BaseModelAdapter {
  private client: OpenAI;
  private circuitBreaker?: CircuitBreakerImpl;
  private costTracker?: CostTrackerImpl;

  constructor(config: OpenAIAdapterConfig) {
    super();

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
      maxRetries: 0, // We handle retries ourselves
      timeout: config.timeout || 60000,
    });

    if (config.enableCircuitBreaker !== false) {
      this.circuitBreaker = new CircuitBreakerImpl();
    }

    if (config.enableCostTracking !== false) {
      this.costTracker = new CostTrackerImpl();
    }
  }

  getName(): string {
    return 'openai';
  }

  protected async executeChat(req: ChatRequest, opts: CallOpts): Promise<ChatResponse> {
    return withSpan(
      {
        name: 'llm.chat',
        attributes: {
          'llm.provider': 'openai',
          'llm.model': req.model,
          'llm.temperature': req.temperature,
          'llm.max_tokens': req.maxTokens || 0,
          'llm.messages.count': req.messages.length,
        },
      },
      async (span) => {
        if (this.circuitBreaker && !this.circuitBreaker.canExecute()) {
          throw new Error('Circuit breaker is OPEN - too many recent failures');
        }

        const startTime = Date.now();
        let retryCount = 0;

        try {
          logger.info({ model: req.model, messageCount: req.messages.length }, 'Calling OpenAI chat API');

      const completion = await this.client.chat.completions.create({
        model: req.model,
        messages: req.messages as OpenAI.ChatCompletionMessageParam[],
        temperature: req.temperature,
        max_tokens: req.maxTokens,
        top_p: req.topP,
        frequency_penalty: req.frequencyPenalty,
        presence_penalty: req.presencePenalty,
        stop: req.stop,
        user: req.user,
        tools: req.tools as OpenAI.ChatCompletionTool[] | undefined,
        tool_choice: req.toolChoice as OpenAI.ChatCompletionToolChoiceOption | undefined,
      });

      const responseTime = Date.now() - startTime;
      const content = completion.choices[0]?.message?.content || '';
      const toolCalls = completion.choices[0]?.message?.tool_calls;

      const usage: Usage | undefined = completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
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
        model: completion.model,
        tokens: usage?.totalTokens,
        responseTime,
        cost: usage ? this.costTracker?.getCostByModel(req.model) : undefined,
      }, 'OpenAI chat API call successful');

      return {
        content,
        finishReason: completion.choices[0]?.finish_reason as ChatResponse['finishReason'],
        usage,
        model: completion.model,
        toolCalls: toolCalls as any[],
        cached: false,
        responseTime,
      };
    } catch (error) {
      if (this.circuitBreaker) {
        this.circuitBreaker.recordFailure();
      }

      logger.error({ error: (error as Error).message, model: req.model }, 'OpenAI chat API call failed');
      throw error;
    }
  }

  protected async executeEmbed(req: EmbedRequest, opts: CallOpts): Promise<number[][]> {
    if (this.circuitBreaker && !this.circuitBreaker.canExecute()) {
      throw new Error('Circuit breaker is OPEN - too many recent failures');
    }

    const startTime = Date.now();

    try {
      logger.info({ model: req.model, textCount: req.texts.length }, 'Calling OpenAI embeddings API');

      const response = await this.client.embeddings.create({
        model: req.model,
        input: req.texts,
        dimensions: req.dimensions,
      });

      const responseTime = Date.now() - startTime;
      const embeddings = response.data.map((item) => item.embedding);

      // Track cost
      if (response.usage && this.costTracker) {
        const usage: Usage = {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: 0,
          totalTokens: response.usage.total_tokens,
        };
        this.costTracker.trackUsage(req.model, usage);
      }

      // Record success
      if (this.circuitBreaker) {
        this.circuitBreaker.recordSuccess();
      }

      logger.info({
        model: response.model,
        embeddings: embeddings.length,
        responseTime,
      }, 'OpenAI embeddings API call successful');

      return embeddings;
    } catch (error) {
      if (this.circuitBreaker) {
        this.circuitBreaker.recordFailure();
      }

      logger.error({ error: (error as Error).message, model: req.model }, 'OpenAI embeddings API call failed');
      throw error;
    }
  }

  /**
   * Streaming chat completion
   */
  async *stream(req: ChatRequest, opts: Partial<CallOpts> = {}): AsyncIterable<ChatDelta> {
    const fullOpts = this.mergeOpts(opts);

    if (this.circuitBreaker && !this.circuitBreaker.canExecute()) {
      throw new Error('Circuit breaker is OPEN - too many recent failures');
    }

    try {
      logger.info({ model: req.model, messageCount: req.messages.length }, 'Starting OpenAI streaming chat');

      const stream = await this.client.chat.completions.create({
        model: req.model,
        messages: req.messages as OpenAI.ChatCompletionMessageParam[],
        temperature: req.temperature,
        max_tokens: req.maxTokens,
        top_p: req.topP,
        frequency_penalty: req.frequencyPenalty,
        presence_penalty: req.presencePenalty,
        stop: req.stop,
        user: req.user,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        const finishReason = chunk.choices[0]?.finish_reason as ChatDelta['finishReason'];

        if (delta || finishReason) {
          yield { delta, finishReason };
        }
      }

      if (this.circuitBreaker) {
        this.circuitBreaker.recordSuccess();
      }

      logger.info({ model: req.model }, 'OpenAI streaming chat completed');
    } catch (error) {
      if (this.circuitBreaker) {
        this.circuitBreaker.recordFailure();
      }

      logger.error({ error: (error as Error).message, model: req.model }, 'OpenAI streaming chat failed');
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check: list models
      await this.client.models.list();
      return true;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'OpenAI health check failed');
      return false;
    }
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return this.circuitBreaker?.getStatus();
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

  /**
   * Get cost tracker
   */
  getCostTracker(): CostTrackerImpl | undefined {
    return this.costTracker;
  }
}

