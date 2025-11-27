# @neonhub/telemetry

OpenTelemetry instrumentation for NeonHub AI & Logic stack.

## Usage

### Initialize (at app entry)

```typescript
import '@neonhub/telemetry'; // Must be first import
```

### Environment Variables

```bash
TELEMETRY_ENABLED=true
SERVICE_NAME=neonhub-orchestrator
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
LOG_LEVEL=info
NODE_ENV=production
```

### Create Spans

```typescript
import { withSpan, addSpanAttributes } from '@neonhub/telemetry';

async function processData() {
  return withSpan(
    {
      name: 'process.data',
      attributes: {
        'data.size': 1024,
        'data.type': 'json',
      },
    },
    async (span) => {
      // Your logic here
      const result = await doWork();
      
      // Add more attributes
      addSpanAttributes({
        'result.count': result.length,
      });
      
      return result;
    }
  );
}
```

### Logging

```typescript
import { logger } from '@neonhub/telemetry';

logger.info({ msg: 'Processing started', jobId: '123' });
logger.warn({ msg: 'Retry attempt', attempt: 2 });
logger.error({ msg: 'Operation failed', error: err.message });
```

## License

MIT

