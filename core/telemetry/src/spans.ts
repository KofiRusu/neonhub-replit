import { trace, Span, SpanStatusCode, context } from '@opentelemetry/api';

const tracer = trace.getTracer('@neonhub/telemetry', '1.0.0');

export interface SpanOptions {
  name: string;
  attributes?: Record<string, any>;
}

/**
 * Create and execute a span
 */
export async function withSpan<T>(
  options: SpanOptions,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(options.name, async (span) => {
    try {
      // Set initial attributes
      if (options.attributes) {
        for (const [key, value] of Object.entries(options.attributes)) {
          if (value !== undefined && value !== null) {
            span.setAttribute(key, value);
          }
        }
      }

      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Create a child span in the current context
 */
export function createSpan(name: string, attributes?: Record<string, any>): Span {
  const span = tracer.startSpan(name, {}, context.active());
  
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined && value !== null) {
        span.setAttribute(key, value);
      }
    }
  }
  
  return span;
}

/**
 * Add attributes to current span
 */
export function addSpanAttributes(attributes: Record<string, any>): void {
  const span = trace.getActiveSpan();
  if (span) {
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined && value !== null) {
        span.setAttribute(key, value);
      }
    }
  }
}

/**
 * Record an event on the current span
 */
export function addSpanEvent(name: string, attributes?: Record<string, any>): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

