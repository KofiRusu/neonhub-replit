import {
  ChatRequest,
  ChatResponse,
  ChatDelta,
  CallOpts,
  EmbedRequest,
  RerankRequest,
} from './types.js';

/**
 * Base interface for LLM adapters
 */
export interface ModelAdapter {
  /**
   * Synchronous chat completion
   */
  chat(req: ChatRequest, opts?: Partial<CallOpts>): Promise<ChatResponse>;

  /**
   * Streaming chat completion
   */
  stream?(req: ChatRequest, opts?: Partial<CallOpts>): AsyncIterable<ChatDelta>;

  /**
   * Generate embeddings for texts
   */
  embed(req: EmbedRequest, opts?: Partial<CallOpts>): Promise<number[][]>;

  /**
   * Rerank documents by relevance to query
   */
  rerank?(req: RerankRequest, opts?: Partial<CallOpts>): Promise<number[]>;

  /**
   * Health check
   */
  healthCheck?(): Promise<boolean>;

  /**
   * Get adapter name
   */
  getName(): string;
}

/**
 * Abstract base class with common retry/timeout logic
 */
export abstract class BaseModelAdapter implements ModelAdapter {
  protected abstract executeChat(req: ChatRequest, opts: CallOpts): Promise<ChatResponse>;
  protected abstract executeEmbed(req: EmbedRequest, opts: CallOpts): Promise<number[][]>;

  abstract getName(): string;

  async chat(req: ChatRequest, opts: Partial<CallOpts> = {}): Promise<ChatResponse> {
    const fullOpts = this.mergeOpts(opts);
    return this.withRetry(() => this.withTimeout(
      () => this.executeChat(req, fullOpts),
      fullOpts.timeout
    ), fullOpts);
  }

  async embed(req: EmbedRequest, opts: Partial<CallOpts> = {}): Promise<number[][]> {
    const fullOpts = this.mergeOpts(opts);
    return this.withRetry(() => this.withTimeout(
      () => this.executeEmbed(req, fullOpts),
      fullOpts.timeout
    ), fullOpts);
  }

  /**
   * Merge provided options with defaults
   */
  protected mergeOpts(opts: Partial<CallOpts>): CallOpts {
    return {
      timeout: opts.timeout ?? 60000,
      maxRetries: opts.maxRetries ?? 3,
      retryDelay: opts.retryDelay ?? 1000,
      circuitBreakerThreshold: opts.circuitBreakerThreshold ?? 5,
      abortSignal: opts.abortSignal,
      metadata: opts.metadata,
    };
  }

  /**
   * Execute with timeout
   */
  protected async withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Execute with exponential backoff retry
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    opts: CallOpts
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry if aborted
        if (opts.abortSignal?.aborted) {
          throw new Error('Operation aborted');
        }

        // Don't retry on final attempt
        if (attempt >= opts.maxRetries) {
          break;
        }

        // Calculate exponential backoff with jitter
        const backoff = opts.retryDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.3 * backoff; // +/- 30% jitter
        const delay = backoff + jitter;

        await this.sleep(delay);
      }
    }

    throw new Error(
      `Operation failed after ${opts.maxRetries} retries: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

