# Federation API Reference

## Overview

The Federation API provides RESTful and gRPC endpoints for managing NeonHub v4.0's federated intelligence ecosystem. This API enables programmatic access to federation operations, monitoring, compliance management, and cross-node coordination.

## API Architecture

```mermaid
graph TB
    subgraph "API Gateway"
        REST[REST API<br/>HTTP/HTTPS]
        GRPC[gRPC API<br/>Protocol Buffers]
        WS[WebSocket<br/>Real-time]
    end

    subgraph "Service Layer"
        AUTH[Authentication<br/>Service]
        FED[Federation<br/>Manager]
        COMPLIANCE[Compliance<br/>Manager]
        MONITOR[Monitoring<br/>Service]
    end

    subgraph "Core Components"
        FM[Federation Manager]
        AIX[AIX Protocol]
        DASHBOARD[Dashboard]
        STORAGE[Distributed Storage]
    end

    REST --> AUTH
    GRPC --> AUTH
    WS --> AUTH

    AUTH --> FED
    AUTH --> COMPLIANCE
    AUTH --> MONITOR

    FED --> FM
    COMPLIANCE --> FM
    MONITOR --> DASHBOARD

    FM --> AIX
    FM --> STORAGE
```

## Authentication and Authorization

### Authentication Methods

#### JWT Token Authentication
```typescript
// JWT authentication headers
const headers = {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'Content-Type': 'application/json'
};

// Token refresh
POST /api/v1/auth/refresh
{
  "refreshToken": "refresh_token_here"
}
```

#### API Key Authentication
```typescript
// API key authentication
const headers = {
  'X-API-Key': 'your-api-key-here',
  'Content-Type': 'application/json'
};
```

#### Certificate-Based Authentication
```typescript
// Mutual TLS authentication
const httpsAgent = new https.Agent({
  cert: fs.readFileSync('client.crt'),
  key: fs.readFileSync('client.key'),
  ca: fs.readFileSync('ca.crt')
});
```

### Authorization Scopes

```typescript
// OAuth 2.0 scopes
const scopes = {
  'federation:read': 'Read federation information',
  'federation:write': 'Modify federation configuration',
  'nodes:manage': 'Manage federation nodes',
  'compliance:read': 'Read compliance data',
  'compliance:admin': 'Manage compliance settings',
  'monitoring:read': 'Read monitoring data',
  'dashboard:access': 'Access dashboard'
};
```

## Federation Management API

### Node Management

#### Register Federation Node
```http
POST /api/v1/federation/nodes
Authorization: Bearer <token>
Content-Type: application/json

{
  "nodeId": "node-123",
  "name": "US East Node",
  "region": "us-east-1",
  "capabilities": [
    "model_training",
    "data_processing",
    "inference"
  ],
  "endpoints": {
    "websocket": "wss://node-123.federation.neonhub.ai:8080",
    "grpc": "grpc://node-123.federation.neonhub.ai:9090",
    "api": "https://node-123.federation.neonhub.ai"
  },
  "resources": {
    "cpu": 16,
    "memory": "32GB",
    "gpu": 2,
    "storage": "1TB"
  },
  "compliance": {
    "gdpr": true,
    "ccpa": true,
    "dataResidency": "US"
  }
}
```

#### Get Node Information
```http
GET /api/v1/federation/nodes/{nodeId}
Authorization: Bearer <token>
```

#### Update Node Configuration
```http
PUT /api/v1/federation/nodes/{nodeId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "capabilities": ["model_training", "inference"],
  "resources": {
    "cpu": 32,
    "memory": "64GB"
  }
}
```

#### Remove Node from Federation
```http
DELETE /api/v1/federation/nodes/{nodeId}
Authorization: Bearer <token>
```

### Federation Operations

#### Get Federation Status
```http
GET /api/v1/federation/status
Authorization: Bearer <token>

Response:
{
  "federationId": "fed-001",
  "status": "active",
  "totalNodes": 42,
  "activeNodes": 40,
  "regions": ["us-east", "eu-west", "ap-south"],
  "uptime": "99.9%",
  "lastUpdate": "2025-10-16T21:27:36Z"
}
```

#### Connect to Remote Node
```http
POST /api/v1/federation/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetNodeId": "remote-node-456",
  "connectionType": "websocket",
  "encryption": true,
  "authentication": {
    "method": "certificate",
    "certificate": "base64_encoded_cert"
  }
}
```

#### Send Message to Federation
```http
POST /api/v1/federation/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "model_update",
  "recipient": {
    "nodeId": "target-node",
    "broadcast": false
  },
  "payload": {
    "modelId": "resnet-50-v2",
    "version": "2.1.0",
    "accuracy": 0.95
  },
  "priority": "high",
  "ttl": 3600000
}
```

## AI Exchange (AIX) API

### Federated Learning Operations

#### Initiate Learning Round
```http
POST /api/v1/aix/learning-rounds
Authorization: Bearer <token>
Content-Type: application/json

{
  "modelId": "federated-model-001",
  "algorithm": "fedavg",
  "participants": [
    "node-1", "node-2", "node-3"
  ],
  "privacy": {
    "differentialPrivacy": {
      "epsilon": 1.0,
      "delta": 1e-5
    }
  },
  "rounds": 10,
  "timeout": 3600000
}
```

#### Submit Model Update
```http
POST /api/v1/aix/model-updates
Authorization: Bearer <token>
Content-Type: application/json

{
  "roundId": "round-123",
  "participantId": "node-1",
  "modelUpdate": {
    "parameters": "compressed_model_data",
    "metadata": {
      "trainingSamples": 10000,
      "epochs": 5,
      "loss": 0.123,
      "accuracy": 0.94
    }
  },
  "privacyProof": "zkp_proof_data"
}
```

#### Get Aggregated Model
```http
GET /api/v1/aix/models/{roundId}/aggregated
Authorization: Bearer <token>

Response:
{
  "roundId": "round-123",
  "modelId": "federated-model-001",
  "aggregatedParameters": "compressed_aggregated_model",
  "metadata": {
    "participants": 3,
    "totalSamples": 30000,
    "aggregationAlgorithm": "fedavg",
    "privacyBudget": 1.0
  },
  "validation": {
    "accuracy": 0.96,
    "loss": 0.089
  }
}
```

### Intelligence Sharing

#### Share Intelligence
```http
POST /api/v1/aix/intelligence
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "pattern",
  "content": {
    "description": "User behavior pattern detected",
    "confidence": 0.89,
    "data": {
      "pattern": "seasonal_trend",
      "frequency": "weekly",
      "impact": "high"
    }
  },
  "sharing": {
    "scope": "federation",
    "recipients": ["node-1", "node-2"],
    "retention": 604800
  }
}
```

#### Query Intelligence
```http
GET /api/v1/aix/intelligence?category=pattern&minConfidence=0.8
Authorization: Bearer <token>

Response:
[
  {
    "id": "intel-123",
    "category": "pattern",
    "content": {
      "description": "Anomaly pattern detected",
      "confidence": 0.92,
      "data": { ... }
    },
    "source": "node-1",
    "timestamp": "2025-10-16T21:27:36Z"
  }
]
```

## Compliance API

### GDPR Operations

#### Submit Data Subject Request
```http
POST /api/v1/compliance/gdpr/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "requestType": "access",
  "dataSubject": {
    "identifier": "user@example.com",
    "identifierType": "email"
  },
  "scope": "all_personal_data",
  "justification": "User requested access to their data"
}
```

#### Process Data Subject Rights
```http
POST /api/v1/compliance/gdpr/process/{requestId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "approve",
  "processedBy": "dpo@neonhub.ai",
  "notes": "Data access request approved",
  "data": {
    "personalData": { ... },
    "processingHistory": [ ... ]
  }
}
```

### CCPA Operations

#### Handle Opt-Out Request
```http
POST /api/v1/compliance/ccpa/opt-out
Authorization: Bearer <token>
Content-Type: application/json

{
  "consumerId": "consumer-123",
  "optOutType": "sale",
  "scope": "future_sales",
  "verification": {
    "method": "email",
    "code": "verification_code"
  }
}
```

#### Generate Privacy Report
```http
GET /api/v1/compliance/ccpa/report/{consumerId}
Authorization: Bearer <token>

Response:
{
  "consumerId": "consumer-123",
  "reportPeriod": "2024-01-01 to 2024-12-31",
  "dataCollected": [
    {
      "category": "identifiers",
      "sources": ["website", "mobile_app"],
      "purposes": ["service_provision", "analytics"],
      "sharedWith": ["analytics_provider"]
    }
  ],
  "optOutStatus": {
    "sale": true,
    "sharing": false,
    "profiling": false
  }
}
```

### Cross-Border Transfers

#### Assess Transfer Risk
```http
POST /api/v1/compliance/transfers/assess
Authorization: Bearer <token>
Content-Type: application/json

{
  "sourceRegion": "EU",
  "destinationRegion": "US",
  "dataCategories": ["personal_data", "sensitive_data"],
  "transferVolume": "high",
  "safeguards": ["SCCs", "encryption"]
}
```

#### Register Transfer
```http
POST /api/v1/compliance/transfers
Authorization: Bearer <token>
Content-Type: application/json

{
  "transferId": "transfer-123",
  "source": {
    "region": "EU",
    "controller": "NeonHub EU"
  },
  "destination": {
    "region": "US",
    "processor": "AWS US-East"
  },
  "data": {
    "categories": ["personal_data"],
    "volume": 10000,
    "sensitivity": "high"
  },
  "safeguards": {
    "mechanism": "SCCs",
    "version": "2021",
    "encryption": true
  },
  "duration": "2025-12-31"
}
```

## Monitoring API

### Health Checks

#### Federation Health
```http
GET /api/v1/monitoring/health/federation
Authorization: Bearer <token>

Response:
{
  "status": "healthy",
  "checks": {
    "nodes": {
      "status": "healthy",
      "total": 42,
      "healthy": 40,
      "degraded": 2
    },
    "connections": {
      "status": "healthy",
      "active": 38,
      "failed": 0
    },
    "aix_protocol": {
      "status": "healthy",
      "messages_processed": 125000,
      "error_rate": 0.001
    }
  },
  "timestamp": "2025-10-16T21:27:36Z"
}
```

#### System Metrics
```http
GET /api/v1/monitoring/metrics?period=1h&granularity=5m
Authorization: Bearer <token>

Response:
{
  "metrics": [
    {
      "timestamp": "2025-10-16T21:20:00Z",
      "federation": {
        "active_nodes": 40,
        "message_throughput": 1200,
        "average_latency": 42
      },
      "aix": {
        "learning_rounds": 5,
        "model_updates": 150,
        "intelligence_shares": 89
      },
      "compliance": {
        "gdpr_requests": 12,
        "ccpa_opt_outs": 3,
        "transfer_assessments": 7
      }
    }
  ]
}
```

### Alert Management

#### Get Active Alerts
```http
GET /api/v1/monitoring/alerts?status=active&severity=critical
Authorization: Bearer <token>

Response:
{
  "alerts": [
    {
      "id": "alert-123",
      "severity": "critical",
      "title": "Federation Node Offline",
      "description": "Node us-east-1-03 has been offline for 15 minutes",
      "timestamp": "2025-10-16T21:25:00Z",
      "acknowledged": false,
      "assignedTo": null,
      "escalation": {
        "level": 1,
        "nextEscalation": "2025-10-16T21:40:00Z"
      }
    }
  ]
}
```

#### Acknowledge Alert
```http
POST /api/v1/monitoring/alerts/{alertId}/acknowledge
Authorization: Bearer <token>
Content-Type: application/json

{
  "acknowledgedBy": "operator@neonhub.ai",
  "notes": "Investigating node connectivity issues"
}
```

## Dashboard API

### Real-Time Data Streams

#### WebSocket Connection
```javascript
// Connect to real-time dashboard stream
const ws = new WebSocket('wss://api.neonhub.ai/dashboard/stream');

ws.onopen = () => {
  // Subscribe to specific data streams
  ws.send(JSON.stringify({
    action: 'subscribe',
    channels: ['federation_health', 'performance_metrics', 'alerts']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch(data.type) {
    case 'federation_health':
      updateFederationHealth(data.payload);
      break;
    case 'performance_metrics':
      updatePerformanceCharts(data.payload);
      break;
    case 'alert':
      handleNewAlert(data.payload);
      break;
  }
};
```

### Dashboard Configuration

#### Get Dashboard Layout
```http
GET /api/v1/dashboard/layout
Authorization: Bearer <token>

Response:
{
  "layout": [
    {
      "id": "federation-overview",
      "type": "federation_status",
      "position": { "x": 0, "y": 0, "width": 12, "height": 4 },
      "config": {
        "showRegions": true,
        "refreshInterval": 30000
      }
    },
    {
      "id": "performance-chart",
      "type": "time_series",
      "position": { "x": 0, "y": 4, "width": 8, "height": 6 },
      "config": {
        "metrics": ["message_throughput", "latency"],
        "period": "1h"
      }
    }
  ]
}
```

#### Update Dashboard Layout
```http
PUT /api/v1/dashboard/layout
Authorization: Bearer <token>
Content-Type: application/json

{
  "layout": [
    {
      "id": "federation-overview",
      "position": { "x": 0, "y": 0, "width": 12, "height": 4 }
    }
  ]
}
```

## Error Handling

### Standard Error Responses

```typescript
// Error response format
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
  status: number;
}

// Common error codes
const errorCodes = {
  'AUTHENTICATION_FAILED': 'Invalid or missing authentication',
  'AUTHORIZATION_FAILED': 'Insufficient permissions',
  'VALIDATION_ERROR': 'Invalid request data',
  'RESOURCE_NOT_FOUND': 'Requested resource not found',
  'RATE_LIMIT_EXCEEDED': 'Too many requests',
  'SERVICE_UNAVAILABLE': 'Service temporarily unavailable',
  'FEDERATION_ERROR': 'Federation operation failed',
  'COMPLIANCE_VIOLATION': 'Compliance requirement not met'
};
```

### Rate Limiting

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
Retry-After: 60

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "details": {
      "limit": 1000,
      "window": "1 hour",
      "reset": "2025-10-16T22:27:36Z"
    }
  }
}
```

## SDK and Client Libraries

### JavaScript/TypeScript SDK

```typescript
import { NeonHubFederationAPI } from '@neonhub/federation-sdk';

const client = new NeonHubFederationAPI({
  baseURL: 'https://api.neonhub.ai',
  apiKey: 'your-api-key'
});

// Register a node
await client.federation.registerNode({
  nodeId: 'my-node',
  capabilities: ['model_training'],
  region: 'us-west-2'
});

// Get federation status
const status = await client.federation.getStatus();
console.log('Federation has', status.totalNodes, 'nodes');
```

### Python SDK

```python
from neonhub_federation import FederationClient

client = FederationClient(
    base_url='https://api.neonhub.ai',
    api_key='your-api-key'
)

# Submit model update
response = client.aix.submit_model_update(
    round_id='round-123',
    model_update={
        'parameters': compressed_params,
        'metadata': {
            'accuracy': 0.95,
            'loss': 0.05
        }
    }
)
```

### Go SDK

```go
package main

import (
    "context"
    "log"
    federation "github.com/neonhub/federation-go-sdk"
)

func main() {
    client := federation.NewClient("https://api.neonhub.ai", "your-api-key")

    // Get node information
    node, err := client.Federation.GetNode(context.Background(), "node-123")
    if err != nil {
        log.Fatal(err)
    }

    log.Printf("Node %s is %s", node.ID, node.Status)
}
```

## Versioning and Compatibility

### API Versioning

- **Current Version**: v1
- **Version Header**: `Accept: application/vnd.neonhub.v1+json`
- **Deprecation Policy**: 12 months notice for breaking changes
- **Backward Compatibility**: Maintained for 2 major versions

### Protocol Evolution

```typescript
// API version negotiation
const apiVersions = {
  supported: ['v1', 'v1.1', 'v2'],
  deprecated: ['v0', 'v0.5'],
  experimental: ['v3-alpha']
};

// Version-specific features
const versionFeatures = {
  'v1': ['basic_federation', 'aix_protocol'],
  'v1.1': ['enhanced_monitoring', 'compliance_api'],
  'v2': ['advanced_security', 'real_time_streams'],
  'v3-alpha': ['ai_powered_insights', 'predictive_monitoring']
};
```

This comprehensive Federation API reference provides all the endpoints and examples needed to integrate with and manage NeonHub v4.0's federated intelligence ecosystem programmatically.