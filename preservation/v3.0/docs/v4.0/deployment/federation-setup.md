# Federation Network Setup Guide

## Overview

This guide provides comprehensive instructions for setting up a NeonHub v4.0 federated network, including node registration, security configuration, and initial deployment.

## Prerequisites

### System Requirements
- **Minimum Hardware**: 4 CPU cores, 8GB RAM, 100GB SSD
- **Network**: 1Gbps internet connection, static IP recommended
- **Operating System**: Ubuntu 20.04+, CentOS 8+, or Docker-compatible host
- **Certificates**: Valid TLS certificates for secure communication

### Software Dependencies
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- Kubernetes 1.24+ (for production deployments)
- Helm 3.8+ (for Kubernetes deployments)

### Network Configuration
- **Firewall**: Open ports 8080 (WebSocket), 9090 (gRPC), 443 (HTTPS)
- **DNS**: Configure federation domain (e.g., federation.neonhub.ai)
- **Load Balancer**: NGINX, HAProxy, or cloud load balancer
- **SSL/TLS**: Wildcard certificate for federation domain

## Federation Architecture

```mermaid
graph TB
    subgraph "Federation Control Plane"
        FM[Federation Manager]
        REG[Node Registry]
        AUTH[Authentication Service]
    end

    subgraph "Federation Nodes"
        NODE1[Node 1<br/>Region: US-East]
        NODE2[Node 2<br/>Region: EU-West]
        NODE3[Node 3<br/>Region: AP-South]
    end

    subgraph "Supporting Services"
        MONITOR[Monitoring]
        LOGGING[Central Logging]
        BACKUP[Backup Service]
    end

    FM --> NODE1
    FM --> NODE2
    FM --> NODE3

    REG --> NODE1
    REG --> NODE2
    REG --> NODE3

    NODE1 --> MONITOR
    NODE2 --> MONITOR
    NODE3 --> MONITOR

    MONITOR --> LOGGING
    MONITOR --> BACKUP
```

## Step-by-Step Setup

### Step 1: Environment Preparation

#### 1.1 Install Dependencies
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install kubectl (for Kubernetes deployments)
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

#### 1.2 Configure Firewall
```bash
# Allow federation ports
sudo ufw allow 8080/tcp
sudo ufw allow 9090/tcp
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp

# Allow SSH (for management)
sudo ufw allow ssh
sudo ufw --force enable
```

#### 1.3 Setup SSL Certificates
```bash
# Create certificate directory
sudo mkdir -p /etc/neonhub/certs

# Copy certificates (replace with your actual certificates)
sudo cp server.crt /etc/neonhub/certs/
sudo cp server.key /etc/neonhub/certs/
sudo cp ca.crt /etc/neonhub/certs/

# Set proper permissions
sudo chmod 600 /etc/neonhub/certs/server.key
sudo chmod 644 /etc/neonhub/certs/server.crt
sudo chmod 644 /etc/neonhub/certs/ca.crt
```

### Step 2: Federation Manager Setup

#### 2.1 Create Federation Manager Configuration
```yaml
# docker-compose.federation.yml
version: '3.8'

services:
  federation-manager:
    image: neonhub/federation-manager:v4.0.0
    container_name: federation-manager
    restart: unless-stopped
    ports:
      - "8080:8080"  # WebSocket
      - "9090:9090"  # gRPC
      - "443:443"    # HTTPS API
    environment:
      - NODE_ENV=production
      - FEDERATION_NODE_ID=node-1
      - FEDERATION_DOMAIN=federation.neonhub.ai
      - WS_PORT=8080
      - GRPC_PORT=9090
      - TLS_CERT_PATH=/etc/certs/server.crt
      - TLS_KEY_PATH=/etc/certs/server.key
      - CA_CERT_PATH=/etc/certs/ca.crt
      - DATABASE_URL=postgresql://federation:password@postgres:5432/federation
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-super-secret-jwt-key
      - ENCRYPTION_KEY=your-32-byte-encryption-key
    volumes:
      - /etc/neonhub/certs:/etc/certs:ro
      - federation-data:/app/data
    depends_on:
      - postgres
      - redis
    networks:
      - federation-network

  postgres:
    image: postgres:15-alpine
    container_name: federation-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=federation
      - POSTGRES_USER=federation
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - federation-network

  redis:
    image: redis:7-alpine
    container_name: federation-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - federation-network

volumes:
  federation-data:
  postgres-data:
  redis-data:

networks:
  federation-network:
    driver: bridge
```

#### 2.2 Deploy Federation Manager
```bash
# Create environment file
cat > .env << EOF
NODE_ENV=production
FEDERATION_NODE_ID=node-1
FEDERATION_DOMAIN=federation.neonhub.ai
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
EOF

# Start federation services
docker-compose -f docker-compose.federation.yml up -d

# Verify deployment
docker-compose -f docker-compose.federation.yml ps
docker-compose -f docker-compose.federation.yml logs federation-manager
```

### Step 3: Node Registration

#### 3.1 Generate Node Credentials
```bash
# Generate node certificate
openssl genrsa -out node-1.key 2048
openssl req -new -key node-1.key -out node-1.csr \
  -subj "/C=US/ST=State/L=City/O=NeonHub/CN=node-1.federation.neonhub.ai"

# Sign certificate with CA
openssl x509 -req -in node-1.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out node-1.crt -days 365

# Create node configuration
cat > node-config.json << EOF
{
  "nodeId": "node-1",
  "name": "Primary Federation Node",
  "region": "us-east-1",
  "capabilities": [
    "model_training",
    "data_processing",
    "inference",
    "federated_learning"
  ],
  "endpoints": {
    "websocket": "wss://node-1.federation.neonhub.ai:8080",
    "grpc": "grpc://node-1.federation.neonhub.ai:9090",
    "api": "https://node-1.federation.neonhub.ai"
  },
  "resources": {
    "cpu": 8,
    "memory": "16GB",
    "storage": "500GB",
    "gpu": 2
  },
  "compliance": {
    "gdpr": true,
    "ccpa": true,
    "dataResidency": "US"
  }
}
EOF
```

#### 3.2 Register Node with Federation
```bash
# Register node via API
curl -X POST https://federation.neonhub.ai/api/v1/nodes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d @node-config.json

# Verify registration
curl -X GET https://federation.neonhub.ai/api/v1/nodes/node-1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Step 4: Security Configuration

#### 4.1 Configure Mutual TLS
```yaml
# Mutual TLS configuration
federation:
  tls:
    enabled: true
    certFile: /etc/certs/server.crt
    keyFile: /etc/certs/server.key
    caFile: /etc/certs/ca.crt
    clientAuth: require_and_verify
    clientCAs:
      - /etc/certs/ca.crt

  auth:
    enabled: true
    type: jwt
    secret: your-super-secret-jwt-key
    expiration: 24h

  encryption:
    enabled: true
    algorithm: AES-256-GCM
    key: your-32-byte-encryption-key
```

#### 4.2 Setup Network Policies
```yaml
# Kubernetes Network Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: federation-network-policy
  namespace: federation
spec:
  podSelector:
    matchLabels:
      app: federation-manager
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: federation-node
    ports:
    - protocol: TCP
      port: 8080
    - protocol: TCP
      port: 9090
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: federation-node
    ports:
    - protocol: TCP
      port: 8080
    - protocol: TCP
      port: 9090
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

### Step 5: Monitoring Setup

#### 5.1 Configure Prometheus Metrics
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'federation-manager'
    static_configs:
      - targets: ['federation-manager:9090']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'federation-nodes'
    static_configs:
      - targets:
        - 'node-1:9090'
        - 'node-2:9090'
        - 'node-3:9090'
    metrics_path: '/metrics'
    scrape_interval: 10s
```

#### 5.2 Setup Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Federation Network Overview",
    "tags": ["federation", "neonhub"],
    "panels": [
      {
        "title": "Active Nodes",
        "type": "stat",
        "targets": [
          {
            "expr": "federation_nodes_active",
            "legendFormat": "Active Nodes"
          }
        ]
      },
      {
        "title": "Message Throughput",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(federation_messages_total[5m])",
            "legendFormat": "Messages/sec"
          }
        ]
      }
    ]
  }
}
```

### Step 6: Testing and Validation

#### 6.1 Health Checks
```bash
# Test federation manager health
curl -k https://federation.neonhub.ai/health

# Test WebSocket connection
wscat -c wss://federation.neonhub.ai:8080

# Test gRPC connection
grpcurl -plaintext federation.neonhub.ai:9090 list
```

#### 6.2 Federation Tests
```bash
# Test node connectivity
curl -X POST https://federation.neonhub.ai/api/v1/test/connectivity \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"targetNodeId": "node-1"}'

# Test message routing
curl -X POST https://federation.neonhub.ai/api/v1/test/message \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "targetNodeId": "node-1",
    "message": {
      "type": "test",
      "payload": {"test": "data"}
    }
  }'
```

## Production Deployment

### High Availability Setup
```yaml
# Production docker-compose with HA
version: '3.8'

services:
  federation-manager-1:
    image: neonhub/federation-manager:v4.0.0
    # ... configuration for primary

  federation-manager-2:
    image: neonhub/federation-manager:v4.0.0
    # ... configuration for secondary

  load-balancer:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/neonhub/certs:/etc/certs
    depends_on:
      - federation-manager-1
      - federation-manager-2
```

### Kubernetes Deployment
```yaml
# federation-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: federation-manager
  namespace: federation
spec:
  replicas: 3
  selector:
    matchLabels:
      app: federation-manager
  template:
    metadata:
      labels:
        app: federation-manager
    spec:
      containers:
      - name: federation-manager
        image: neonhub/federation-manager:v4.0.0
        ports:
        - containerPort: 8080
          name: websocket
        - containerPort: 9090
          name: grpc
        env:
        - name: FEDERATION_NODE_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: KUBERNETES_SERVICE_HOST
          value: "kubernetes.default.svc"
        volumeMounts:
        - name: certs
          mountPath: /etc/certs
          readOnly: true
      volumes:
      - name: certs
        secret:
          secretName: federation-certs
---
apiVersion: v1
kind: Service
metadata:
  name: federation-manager
  namespace: federation
spec:
  selector:
    app: federation-manager
  ports:
  - name: websocket
    port: 8080
    targetPort: 8080
  - name: grpc
    port: 9090
    targetPort: 9090
  type: LoadBalancer
```

## Troubleshooting

### Common Issues

#### Connection Failures
```
Error: Connection refused
Solution: Check firewall rules and port availability
```

#### Certificate Errors
```
Error: TLS handshake failed
Solution: Verify certificate validity and CA trust
```

#### Authentication Failures
```
Error: Invalid token
Solution: Check JWT configuration and token expiration
```

### Monitoring Commands
```bash
# Check container logs
docker-compose logs -f federation-manager

# Monitor network connections
netstat -tlnp | grep :8080
netstat -tlnp | grep :9090

# Check certificate validity
openssl x509 -in /etc/certs/server.crt -text -noout

# Test federation connectivity
curl -v https://federation.neonhub.ai/api/v1/health
```

## Security Best Practices

1. **Regular Certificate Rotation**: Rotate certificates every 90 days
2. **Network Segmentation**: Isolate federation traffic from other services
3. **Access Control**: Implement least-privilege access policies
4. **Monitoring**: Enable comprehensive logging and alerting
5. **Backup**: Regular backup of federation state and configurations
6. **Updates**: Keep all components updated with security patches

## Support

For additional support:
- **Documentation**: [docs.neonhub.ai/v4.0/federation](https://docs.neonhub.ai/v4.0/federation)
- **Community**: [community.neonhub.ai/federation](https://community.neonhub.ai/federation)
- **Enterprise Support**: enterprise@neonhub.ai