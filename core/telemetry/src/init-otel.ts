import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const ENABLED = process.env.TELEMETRY_ENABLED === 'true';

if (!ENABLED) {
  console.log('[otel] telemetry disabled');
} else {
  const serviceName = process.env.SERVICE_NAME ?? 'neonhub-ai-logic';
  const serviceVersion = process.env.SERVICE_VERSION ?? 'v1.0.0';
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';

  // Ensure stable resource attributes for production
  const resourceAttrs: Record<string, string> = {
    [ATTR_SERVICE_NAME]: serviceName,
    'service.version': serviceVersion,
    'deployment.environment': process.env.NODE_ENV || 'development',
  };

  // Merge with any existing OTEL_RESOURCE_ATTRIBUTES
  if (process.env.OTEL_RESOURCE_ATTRIBUTES) {
    const existingAttrs = process.env.OTEL_RESOURCE_ATTRIBUTES.split(',');
    existingAttrs.forEach((attr) => {
      const [key, value] = attr.split('=');
      if (key && value) {
        resourceAttrs[key.trim()] = value.trim();
      }
    });
  }

  const resource = new Resource(resourceAttrs);

  const sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({
      url: `${otlpEndpoint}/v1/traces`,
    }),
    metricReader: new OTLPMetricExporter({
      url: `${otlpEndpoint}/v1/metrics`,
    }) as any,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk
    .start()
    .then(() => console.log(`[otel] started for ${serviceName} → ${otlpEndpoint}`))
    .catch((e) => console.error('[otel] failed to start', e));

  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('[otel] shutdown complete'))
      .finally(() => process.exit(0));
  });
}

export {};

