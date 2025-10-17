# Global Orchestrator Module

The Global Orchestrator module provides a comprehensive solution for managing inter-federation routing, scaling, and failover across distributed nodes in the NeonHub ecosystem. It serves as the central coordination layer that ensures high availability, intelligent load distribution, and seamless communication between multiple federations.

## Features

### 🚀 Core Capabilities

- **Intelligent Routing**: Advanced routing algorithms including round-robin, least connections, geographic routing, and adaptive routing
- **Auto Scaling**: Automatic scaling based on load metrics with predictive scaling capabilities
- **Failover Management**: High availability through automatic failover and recovery mechanisms
- **Health Monitoring**: Continuous health checks and metrics collection for all nodes
- **Node Discovery**: Automatic discovery and registration of federation nodes
- **Configuration Management**: Centralized configuration with hot-reloading capabilities

### 🔧 Key Components

#### GlobalOrchestratorManager
The main coordinator that orchestrates all services and provides the primary API for managing the global federation infrastructure.

#### Service Components
- **NodeDiscoveryService**: Discovers and tracks federation nodes across the network
- **HealthMonitoringService**: Monitors node health and collects performance metrics
- **IntelligentRoutingService**: Routes messages using various algorithms and strategies
- **AutoScalingService**: Manages automatic scaling based on load and performance metrics
- **FailoverService**: Handles failover scenarios and ensures high availability
- **ConfigurationManager**: Manages configuration with file watching and validation

## Installation

```bash
npm install @neonhub/orchestrator-global
```

## Quick Start

```typescript
import { GlobalOrchestratorManager, GlobalOrchestratorConfig } from '@neonhub/orchestrator-global';

const config: GlobalOrchestratorConfig = {
  orchestratorId: 'global-orchestrator-1',
  discovery: {
    enabled: true,
    serviceRegistryUrl: 'http://service-registry:8080',
    discoveryInterval: 30000,
    heartbeatInterval: 10000,
    nodeTimeout: 60000,
    maxRetries: 3
  },
  healthMonitoring: {
    enabled: true,
    checkInterval: 15000,
    timeout: 5000,
    unhealthyThreshold: 3,
    healthyThreshold: 2,
    metricsCollectionInterval: 30000
  },
  routing: {
    algorithm: 'adaptive',
    loadBalancingStrategy: 'weighted',
    geoRoutingEnabled: true,
    latencyThreshold: 100,
    capacityThreshold: 80,
    adaptiveRouting: true
  },
  scaling: {
    enabled: true,
    minNodes: 3,
    maxNodes: 50,
    scaleUpThreshold: 75,
    scaleDownThreshold: 25,
    cooldownPeriod: 300,
    predictiveScaling: true,
    metricsWindow: 300
  },
  failover: {
    enabled: true,
    backupNodes: ['backup-1', 'backup-2'],
    failoverTimeout: 30000,
    autoRecovery: true,
    dataReplication: true
  },
  federation: {
    federationManagers: [
      {
        federationId: 'fed-1',
        endpoint: 'http://fed-1-manager:8080',
        auth: { type: 'jwt', token: 'your-jwt-token' },
        capabilities: ['routing', 'scaling']
      }
    ],
    messageRoutingEnabled: true,
    crossFederationCommunication: true,
    sharedStateSync: true
  }
};

const orchestrator = new GlobalOrchestratorManager(config);

// Start the orchestrator
await orchestrator.start();

// Route a message
const routingDecision = await orchestrator.routeMessage({
  id: 'msg-123',
  type: 'federation_message',
  payload: { data: 'Hello World' },
  timestamp: Date.now(),
  sourceNodeId: 'node-1',
  priority: 1,
  globalRouting: true
});

console.log('Message routed to:', routingDecision.targetNodeId);

// Get global metrics
const metrics = orchestrator.getGlobalMetrics();
console.log('Active nodes:', metrics.activeNodes);
console.log('Total federations:', metrics.totalFederations);

// Stop the orchestrator
await orchestrator.stop();
```

## Configuration

### Discovery Configuration
```typescript
{
  enabled: true,
  serviceRegistryUrl: 'http://service-registry:8080',
  discoveryInterval: 30000,     // Discovery polling interval (ms)
  heartbeatInterval: 10000,     // Heartbeat sending interval (ms)
  nodeTimeout: 60000,          // Node timeout threshold (ms)
  maxRetries: 3                // Maximum discovery retries
}
```

### Routing Configuration
```typescript
{
  algorithm: 'adaptive',       // round_robin, least_connections, geographic, adaptive
  loadBalancingStrategy: 'weighted', // random, round_robin, least_connections, ip_hash, weighted
  geoRoutingEnabled: true,     // Enable geographic routing
  latencyThreshold: 100,       // Maximum acceptable latency (ms)
  capacityThreshold: 80,       // Capacity threshold percentage
  adaptiveRouting: true        // Enable adaptive routing based on metrics
}
```

### Scaling Configuration
```typescript
{
  enabled: true,
  minNodes: 3,                 // Minimum number of nodes
  maxNodes: 50,                // Maximum number of nodes
  scaleUpThreshold: 75,        // CPU/memory threshold to scale up (%)
  scaleDownThreshold: 25,      // CPU/memory threshold to scale down (%)
  cooldownPeriod: 300,         // Cooldown between scaling actions (seconds)
  predictiveScaling: true,     // Enable predictive scaling
  metricsWindow: 300           // Metrics analysis window (seconds)
}
```

### Failover Configuration
```typescript
{
  enabled: true,
  backupNodes: ['backup-1', 'backup-2'],
  failoverTimeout: 30000,      // Failover timeout (ms)
  autoRecovery: true,          // Enable automatic recovery
  dataReplication: true        // Enable data replication for failover
}
```

## API Reference

### GlobalOrchestratorManager

#### Methods

- `start(): Promise<void>` - Start the orchestrator
- `stop(): Promise<void>` - Stop the orchestrator
- `routeMessage(message: OrchestratorMessage): Promise<RoutingDecision>` - Route a message
- `handleNodeFailure(nodeId: string, reason: string): Promise<void>` - Handle node failure
- `recoverNode(nodeId: string): Promise<void>` - Recover a failed node
- `getGlobalTopology(): GlobalTopology` - Get current global topology
- `getGlobalMetrics(): GlobalMetrics` - Get global metrics
- `updateConfiguration(updates: Partial<GlobalOrchestratorConfig>): Promise<void>` - Update configuration
- `manualScaling(action: 'scale_up' | 'scale_down', targetNodes: string[], reason: string): Promise<void>` - Manual scaling
- `manualFailover(groupId: string, targetNodeId: string, reason: string): Promise<void>` - Manual failover

#### Events

- `started` - Orchestrator has started
- `stopped` - Orchestrator has stopped
- `nodeDiscovered` - New node discovered
- `nodeLost` - Node lost
- `nodeFailed` - Node failure handled
- `nodeRecovered` - Node recovered
- `scalingExecuted` - Scaling action executed
- `failoverCompleted` - Failover completed
- `topologyUpdated` - Global topology updated
- `configUpdated` - Configuration updated

## Routing Algorithms

### Round Robin
Distributes requests sequentially across available nodes.

### Least Connections
Routes to the node with the fewest active connections.

### Geographic Routing
Routes requests to the geographically closest nodes to minimize latency.

### Adaptive Routing
Uses real-time metrics and machine learning to optimize routing decisions.

## Scaling Strategies

### Reactive Scaling
Scales based on current load metrics (CPU, memory, connections).

### Predictive Scaling
Uses historical data and patterns to predict and prevent load spikes.

### Scheduled Scaling
Scales based on time-based patterns and schedules.

## Failover Mechanisms

### Automatic Failover
Automatically detects failures and switches to backup nodes.

### Manual Failover
Allows administrators to manually trigger failover operations.

### Failback
Automatically restores services to primary nodes when they recover.

## Monitoring and Metrics

The orchestrator provides comprehensive monitoring:

- **Node Health**: Real-time health status of all nodes
- **Performance Metrics**: CPU, memory, latency, throughput
- **Routing Metrics**: Success rates, response times, error rates
- **Scaling Events**: Scaling decisions and their impacts
- **Failover Events**: Failover occurrences and recovery times

## Integration with Federation Infrastructure

The Global Orchestrator integrates seamlessly with existing federation components:

- **FederationManager**: Communicates with individual federation managers
- **WebSocket/GRPC**: Uses existing communication protocols
- **Authentication**: Leverages federation authentication mechanisms
- **Load Balancing**: Integrates with federation load balancers

## Error Handling

Comprehensive error handling with custom error types:

- `GlobalOrchestratorError`: Base error class for orchestrator operations
- Specific error codes for different failure scenarios
- Detailed error logging and reporting
- Graceful degradation on component failures

## Logging

Flexible logging system with multiple loggers:

- `ConsoleLogger`: Simple console-based logging
- `RedisLogger`: Distributed logging with Redis backend
- Configurable log levels and formats
- Structured logging with metadata

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Lint the code
npm run lint

# Format code
npm run format
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- GitHub Issues: [Create an issue](https://github.com/neonhub/core-orchestrator-global/issues)
- Documentation: [Full API Docs](https://docs.neonhub.ai/orchestrator-global)
- Community: [NeonHub Community Forum](https://community.neonhub.ai)