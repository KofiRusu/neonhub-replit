# NeonHub v6.0 API Reference

## Base URL

```
Production: https://api.neonhub.ai/v6.0
Staging: https://staging-api.neonhub.ai/v6.0
Development: http://localhost:3001
```

## Authentication

All API endpoints require authentication using JWT tokens:

```bash
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

```http
POST /auth/token
Content-Type: application/json

{
  "client_id": "your-client-id",
  "client_secret": "your-client-secret"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## AI Governance APIs

### Evaluate Action

Evaluates an action against configured governance policies.

```http
POST /api/governance/evaluate
```

**Request Body:**
```json
{
  "action": "model_inference",
  "context": {
    "modelId": "gpt-4",
    "userId": "user-123",
    "dataType": "personal",
    "jurisdiction": "US"
  }
}
```

**Response:**
```json
{
  "success": true,
  "evaluation": {
    "allowed": true,
    "violations": [],
    "recommendations": [
      "Consider implementing additional logging for this action"
    ]
  },
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Evaluation successful
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Missing or invalid authentication
- `500 Internal Server Error` - Server error

---

### Create/Update Policy

Creates a new policy or updates an existing one.

```http
POST /api/governance/policies
```

**Request Body:**
```json
{
  "id": "data-privacy-policy",
  "name": "Data Privacy Policy",
  "description": "Ensures data privacy compliance",
  "version": "1.0.0",
  "jurisdiction": ["US", "EU"],
  "category": "privacy",
  "rules": [
    {
      "id": "pii-detection",
      "name": "PII Detection",
      "description": "Detect personally identifiable information",
      "condition": {
        "type": "attribute",
        "operator": "contains",
        "attribute": "dataType",
        "value": "pii"
      },
      "action": {
        "type": "quarantine",
        "parameters": { "duration": 30 },
        "severity": "high"
      },
      "priority": 1,
      "enabled": true
    }
  ],
  "metadata": {
    "author": "Compliance Team",
    "tags": ["privacy", "data-protection"],
    "complianceFrameworks": ["GDPR", "CCPA"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Policy added successfully",
  "policyId": "data-privacy-policy"
}
```

---

### List All Policies

Retrieves all configured policies.

```http
GET /api/governance/policies
```

**Response:**
```json
{
  "success": true,
  "policies": [
    {
      "id": "data-privacy-policy",
      "name": "Data Privacy Policy",
      "version": "1.0.0",
      "enabled": true,
      "ruleCount": 5
    }
  ],
  "count": 1
}
```

---

### Ethical Assessment

Performs an ethical impact assessment.

```http
POST /api/governance/ethics/assess
```

**Request Body:**
```json
{
  "scenario": "Automated decision making for loan approval",
  "stakeholders": ["applicants", "lenders", "society"],
  "potentialImpacts": [
    "financial access",
    "fairness concerns",
    "privacy implications"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "assessment": {
    "score": 75,
    "concerns": [
      "Potential for bias in decision making",
      "Limited transparency in model decisions"
    ],
    "recommendations": [
      "Implement explainability features",
      "Regular bias audits",
      "Human oversight for edge cases"
    ]
  },
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

---

### System Health

Gets the health status of the governance system.

```http
GET /api/governance/health
```

**Response:**
```json
{
  "success": true,
  "health": {
    "policyEngine": true,
    "ethicalFramework": true,
    "legalCompliance": true,
    "auditLogger": true
  },
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

---

### Audit Logs

Retrieves audit logs with optional filtering.

```http
GET /api/governance/audit-logs?startDate=2025-10-01&endDate=2025-10-17&level=info
```

**Query Parameters:**
- `startDate` (optional) - ISO 8601 date string
- `endDate` (optional) - ISO 8601 date string
- `level` (optional) - Log level: info, warn, error, critical
- `category` (optional) - Log category

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "log-123",
      "timestamp": "2025-10-17T00:00:00.000Z",
      "level": "info",
      "category": "policy_evaluation",
      "action": "evaluate_policy",
      "userId": "user-123",
      "result": "allowed"
    }
  ],
  "count": 1
}
```

---

## Data Trust APIs

### Hash Data

Generates a cryptographic hash for data integrity.

```http
POST /api/data-trust/hash
```

**Request Body:**
```json
{
  "data": {
    "modelWeights": [1.0, 2.5, 3.2],
    "version": "v1.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "hash": "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
  "algorithm": "sha256",
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

---

### Verify Integrity

Verifies data integrity against an expected hash.

```http
POST /api/data-trust/verify
```

**Request Body:**
```json
{
  "data": {
    "modelWeights": [1.0, 2.5, 3.2],
    "version": "v1.0"
  },
  "expectedHash": "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"
}
```

**Response:**
```json
{
  "success": true,
  "isValid": true,
  "actualHash": "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
  "message": "Data integrity verified"
}
```

---

### Track Provenance

Records a provenance event in the data lineage.

```http
POST /api/data-trust/provenance/track
```

**Request Body:**
```json
{
  "eventType": "MODIFIED",
  "dataId": "model-v1.0",
  "actor": "data-scientist@example.com",
  "action": "Updated model weights",
  "metadata": {
    "reason": "Improved accuracy",
    "timestamp": "2025-10-17T00:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "event-456",
  "timestamp": "2025-10-17T00:00:00.000Z",
  "hash": "b8ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434b"
}
```

---

### Get Provenance History

Retrieves the complete provenance chain for a data asset.

```http
GET /api/data-trust/provenance/:dataId
```

**Example:**
```http
GET /api/data-trust/provenance/model-v1.0
```

**Response:**
```json
{
  "success": true,
  "dataId": "model-v1.0",
  "history": [
    {
      "eventId": "event-123",
      "eventType": "CREATED",
      "timestamp": "2025-10-15T00:00:00.000Z",
      "actor": "data-scientist@example.com",
      "action": "Created model",
      "hash": "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"
    },
    {
      "eventId": "event-456",
      "eventType": "MODIFIED",
      "timestamp": "2025-10-17T00:00:00.000Z",
      "actor": "data-scientist@example.com",
      "action": "Updated model weights",
      "hash": "b8ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434b"
    }
  ],
  "count": 2
}
```

---

### Verify Provenance Chain

Verifies the integrity of the entire provenance chain.

```http
GET /api/data-trust/provenance/:dataId/verify
```

**Response:**
```json
{
  "success": true,
  "dataId": "model-v1.0",
  "isValid": true,
  "eventCount": 2,
  "message": "Provenance chain is valid"
}
```

---

## Eco-Optimizer APIs

### Get Energy Metrics

Retrieves current energy consumption metrics.

```http
GET /api/eco-metrics/energy
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "totalEnergy": 1250.5,
    "energyByProvider": {
      "aws": 750.2,
      "azure": 300.1,
      "gcp": 200.2
    },
    "timestamp": "2025-10-17T00:00:00.000Z"
  },
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

---

### Calculate Carbon Footprint

Calculates CO2 emissions for specified resources.

```http
POST /api/eco-metrics/carbon
```

**Request Body:**
```json
{
  "resources": [
    {
      "type": "compute",
      "provider": "aws",
      "instanceType": "t3.large",
      "region": "us-east-1",
      "utilizationPercent": 75,
      "durationHours": 24
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "footprint": {
    "totalCarbon": 125.5,
    "carbonByProvider": {
      "aws": 125.5
    },
    "recommendations": [
      "Consider using us-west-1 region (50% renewable energy)",
      "Implement auto-shutdown for idle instances"
    ]
  },
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

---

### Optimize Resources

Provides optimization recommendations for resources.

```http
POST /api/eco-metrics/optimize
```

**Request Body:**
```json
{
  "resources": [
    {
      "resourceId": "i-1234567890",
      "resourceType": "compute",
      "provider": "aws",
      "region": "us-east-1",
      "utilizationRate": 25,
      "cost": 150
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "optimization": {
    "optimized": true,
    "savings": {
      "energy": 125.5,
      "cost": 75.0,
      "carbon": 50.2
    },
    "recommendations": [
      {
        "type": "right-sizing",
        "description": "Downsize from t3.large to t3.medium",
        "impact": {
          "energySavings": 50.0,
          "costSavings": 35.0
        }
      }
    ]
  },
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

---

### Efficiency Analysis

Analyzes system efficiency over a time period.

```http
GET /api/eco-metrics/efficiency?startDate=2025-10-01&endDate=2025-10-17
```

**Query Parameters:**
- `startDate` (required) - ISO 8601 date string
- `endDate` (required) - ISO 8601 date string

**Response:**
```json
{
  "success": true,
  "analysis": {
    "overallScore": 85,
    "metrics": {
      "pue": 1.2,
      "cue": 0.3,
      "energyEfficiency": 88
    },
    "inefficiencies": [
      "High PUE in us-east-1 datacenter"
    ],
    "recommendations": [
      "Improve cooling efficiency",
      "Consolidate workloads"
    ]
  },
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

---

### Green AI Recommendations

Gets sustainability recommendations for AI models.

```http
POST /api/eco-metrics/green-ai
```

**Request Body:**
```json
{
  "name": "GPT-Large",
  "parameters": 1500000000,
  "trainingData": 100000000,
  "framework": "pytorch",
  "accelerator": "gpu"
}
```

**Response:**
```json
{
  "success": true,
  "recommendations": {
    "score": 72,
    "recommendations": [
      {
        "priority": "high",
        "title": "Use Mixed Precision Training",
        "impact": {
          "energyReduction": 30,
          "carbonReduction": 30
        }
      }
    ],
    "estimatedSavings": {
      "energy": 150.5,
      "carbon": 75.2,
      "cost": 50.0
    }
  },
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

---

## Global Orchestration APIs

### Register Node

Registers a new node in the orchestration network.

```http
POST /api/orchestration/nodes/register
```

**Request Body:**
```json
{
  "id": "node-us-east-1a",
  "region": "us-east-1",
  "endpoint": "https://node1.neonhub.ai",
  "capabilities": ["model_inference", "data_processing"],
  "metadata": {
    "availabilityZone": "us-east-1a",
    "instanceType": "c5.2xlarge"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Node registered successfully",
  "nodeId": "node-us-east-1a"
}
```

---

### Discover Nodes

Discovers available nodes, optionally filtered by region.

```http
GET /api/orchestration/nodes?region=us-east-1
```

**Query Parameters:**
- `region` (optional) - Filter by region

**Response:**
```json
{
  "success": true,
  "nodes": [
    {
      "id": "node-us-east-1a",
      "region": "us-east-1",
      "endpoint": "https://node1.neonhub.ai",
      "status": "online",
      "capabilities": ["model_inference", "data_processing"],
      "lastSeen": "2025-10-17T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Route Request

Routes a request to the optimal node.

```http
POST /api/orchestration/route
```

**Request Body:**
```json
{
  "requestId": "req-789",
  "sourceRegion": "us-east-1",
  "priority": "high",
  "payload": {
    "operation": "inference",
    "modelId": "gpt-4"
  }
}
```

**Response:**
```json
{
  "success": true,
  "routing": {
    "targetNode": {
      "id": "node-us-east-1a",
      "endpoint": "https://node1.neonhub.ai"
    },
    "route": {
      "path": ["gateway", "node-us-east-1a"],
      "protocol": "https"
    },
    "latency": 5
  },
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

---

### System Health

Gets the overall orchestration system health.

```http
GET /api/orchestration/health
```

**Response:**
```json
{
  "success": true,
  "health": {
    "overall": "healthy",
    "nodes": [
      {
        "id": "node-us-east-1a",
        "status": "healthy",
        "cpuUsage": 45,
        "memoryUsage": 60
      }
    ],
    "metrics": {
      "totalNodes": 10,
      "healthyNodes": 10,
      "degradedNodes": 0,
      "offlineNodes": 0
    }
  },
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

---

### Evaluate Scaling

Evaluates whether to scale up or down.

```http
POST /api/orchestration/scaling/evaluate
```

**Request Body:**
```json
{
  "cpuUtilization": 85,
  "memoryUtilization": 75,
  "requestRate": 1500
}
```

**Response:**
```json
{
  "success": true,
  "decision": {
    "action": "scale-up",
    "currentReplicas": 5,
    "targetReplicas": 7,
    "reason": "CPU utilization above threshold (85% > 70%)"
  },
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

---

### Execute Failover

Triggers failover for a failed node.

```http
POST /api/orchestration/failover/:nodeId
```

**Example:**
```http
POST /api/orchestration/failover/node-us-east-1a
```

**Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "backupNode": {
      "id": "node-us-east-1b",
      "endpoint": "https://node2.neonhub.ai"
    },
    "message": "Failover executed successfully"
  },
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

---

## Error Responses

All API endpoints follow a consistent error response format:

```json
{
  "error": "Error description",
  "details": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_REQUEST` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Rate Limiting

API requests are rate-limited per client:

- **Standard Tier:** 1,000 requests/hour
- **Professional Tier:** 10,000 requests/hour
- **Enterprise Tier:** Unlimited

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1634400000
```

---

## Pagination

Endpoints that return lists support pagination:

```http
GET /api/governance/audit-logs?page=1&limit=50
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

**Response includes pagination metadata:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "pages": 20
  }
}
```

---

## Webhooks

Subscribe to real-time events via webhooks:

### Register Webhook

```http
POST /api/webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks",
  "events": ["policy.violated", "provenance.created", "node.failed"],
  "secret": "your-webhook-secret"
}
```

### Webhook Events

- `policy.violated` - Policy violation detected
- `policy.created` - New policy created
- `ethics.concern` - Ethical concern raised
- `provenance.created` - New provenance event
- `energy.threshold` - Energy threshold exceeded
- `carbon.alert` - High carbon emissions
- `node.registered` - New node registered
- `node.failed` - Node failure detected
- `scaling.executed` - Scaling action performed

---

## SDK Support

Official SDKs available:

- **TypeScript/JavaScript:** `npm install @neonhub/sdk`
- **Python:** `pip install neonhub-sdk`
- **Go:** `go get github.com/neonhub/sdk-go`
- **Java:** Available via Maven Central

---

**Version:** 6.0.0  
**Last Updated:** October 2025  
**API Stability:** Stable