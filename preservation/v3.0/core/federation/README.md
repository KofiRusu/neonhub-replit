# NeonHub Federation Module v4.0

A secure, high-performance communication system for distributed NeonHub instances enabling federated learning and intelligence sharing.

## Features

- **WebSocket + gRPC Communication**: Real-time messaging with structured data exchange
- **TLS/SSL Encryption**: Secure connections with certificate-based authentication
- **Connection Pooling**: Efficient resource management with configurable pools
- **Load Balancing**: Multiple strategies (round-robin, least connections, weighted)
- **Health Checks**: Automatic node health monitoring and failover
- **Authentication & Authorization**: JWT, certificate, and API key support
- **Reconnection Logic**: Automatic reconnection with exponential backoff
- **Comprehensive Logging**: Structured logging with configurable levels
- **TypeScript Support**: Full type safety and IntelliSense support

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Federation    │    │   Federation    │
│     Manager     │◄──►│     Manager     │
│                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ WebSocket   │ │    │ │ WebSocket   │ │
│ │  Server     │ │    │ │  Client     │ │
│ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   gRPC      │ │    │ │   gRPC      │ │
│ │  Server     │ │    │ │  Client     │ │
│ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              Secure Channel
```

## Installation

```bash
npm install @neonhub/federation
```

## Quick Start

```typescript
import { FederationManager, LoadBalancingStrategy } from '@neonhub/federation';

const federationManager = new FederationManager({
  nodeId: 'node-1',
  wsConfig: {
    host: 'localhost',
    port: 8080,
    tls: { enabled: true, certPath: './certs/server.crt', keyPath: './certs/server.key' },
    auth: { enabled: true, type: 'jwt', token: 'your-secret-key' }
  },
  grpcConfig: {
    host: 'localhost',
    port: 9090,
    tls: { enabled: true, certPath: './certs/server.crt', keyPath: './certs/server.key' }
  },
  poolConfig: {
    enabled: true,
    minConnections: 2,
    maxConnections: 10,
    acquireTimeout: 30000,
    idleTimeout: 600000
  },
  healthCheckConfig: {
    enabled: true,
    interval: 30000,
    timeout: 5000,
    unhealthyThreshold: 3,
    healthyThreshold: 2
  },
  loadBalancingStrategy: LoadBalancingStrategy.LEAST_CONNECTIONS
});

// Start the federation manager
await federationManager.start();

// Connect to another node
await federationManager.connectToNode({
  nodeId: 'node-2',
  address: '192.168.1.100',
  port: 8080,
  capabilities: ['model_training', 'data_processing'],
  status: 'online',
  lastSeen: Date.now()
});

// Send a message
await federationManager.sendMessage({
  id: 'msg-123',
  type: 'model_update',
  payload: { modelVersion: 'v2.1', accuracy: 0.95 },
  timestamp: Date.now(),
  sourceNodeId: 'node-1',
  priority: 1
});
```

## Configuration

### WebSocket Configuration

```typescript
interface ConnectionConfig {
  host: string;
  port: number;
  tls?: {
    enabled: boolean;
    certPath?: string;
    keyPath?: string;
    caPath?: string;
    rejectUnauthorized?: boolean;
  };
  auth?: {
    enabled: boolean;
    type: 'jwt' | 'certificate' | 'api_key';
    token?: string;
    certPath?: string;
    keyPath?: string;
    apiKey?: string;
  };
  reconnect?: {
    enabled: boolean;
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
}
```

### gRPC Configuration

Similar to WebSocket configuration but focused on structured data exchange.

### Connection Pool Configuration

```typescript
interface PoolConfig {
  enabled: boolean;
  minConnections: number;
  maxConnections: number;
  acquireTimeout: number;
  idleTimeout: number;
}
```

### Health Check Configuration

```typescript
interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  unhealthyThreshold: number;
  healthyThreshold: number;
}
```

## Message Types

The federation system supports various message types for different use cases:

- `heartbeat`: Connection health monitoring
- `model_update`: Federated learning model updates
- `data_sharing`: Secure data exchange between nodes
- `coordination`: Cluster coordination messages
- `health_check`: Health status reporting
- `error_report`: Error notifications
- `metrics_report`: Performance metrics
- `config_update`: Configuration synchronization

## Security

- **TLS 1.3**: End-to-end encryption for all communications
- **Certificate Authentication**: Mutual TLS for node verification
- **JWT Tokens**: Bearer token authentication for API access
- **API Keys**: Simple key-based authentication
- **Message Signing**: Cryptographic message integrity verification

## Monitoring

The federation module provides comprehensive metrics:

```typescript
const metrics = federationManager.getMetrics();
console.log(metrics);
// {
//   messagesSent: 150,
//   messagesReceived: 145,
//   bytesSent: 24560,
//   bytesReceived: 23890,
//   connectionsActive: 3,
//   connectionsTotal: 5,
//   errorsTotal: 2,
//   latencyMs: 45,
//   uptimeSeconds: 3600
// }
```

## Error Handling

All errors are wrapped in `FederationError` with specific error codes:

- `CONNECTION_FAILED`: Network connection issues
- `AUTHENTICATION_FAILED`: Authentication failures
- `AUTHORIZATION_FAILED`: Permission issues
- `MESSAGE_TIMEOUT`: Message delivery timeouts
- `INVALID_MESSAGE`: Malformed messages
- `NODE_UNAVAILABLE`: Target node unreachable
- `TLS_ERROR`: TLS/SSL issues
- `POOL_EXHAUSTED`: Connection pool limits reached
- `HEALTH_CHECK_FAILED`: Health check failures

## Development

```bash
# Install dependencies
npm install

# Build the module
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## License

This module is part of the NeonHub v4.0 ecosystem and follows the same licensing terms.