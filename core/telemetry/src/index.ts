/**
 * @neonhub/telemetry
 * 
 * OpenTelemetry instrumentation for AI & Logic stack
 */

// Initialize OTel first
import './init-otel.js';

export * from './logger.js';
export * from './spans.js';
export { trace, context } from '@opentelemetry/api';

