import pino from 'pino';
import { context, trace } from '@opentelemetry/api';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
  base: {
    service: process.env.SERVICE_NAME ?? 'neonhub-ai-logic',
    env: process.env.NODE_ENV ?? 'development',
  },
  // Add trace-log correlation
  mixin() {
    const span = trace.getSpan(context.active());
    const spanContext = span?.spanContext();
    return spanContext
      ? {
          trace_id: spanContext.traceId,
          span_id: spanContext.spanId,
          trace_flags: spanContext.traceFlags,
        }
      : {};
  },
});

