// Import types from federation module (will be available at runtime)

// Re-export key types from federation for compatibility
export interface NodeInfo {
  nodeId: string;
  address: string;
  port: number;
  capabilities: string[];
  status: string;
  lastSeen: number;
  metadata?: Record<string, any>;
}

export interface FederationMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  sourceNodeId: string;
  targetNodeId?: string;
  priority: number;
  ttl?: number;
}

export interface FederationMetrics {
  messagesSent: number;
  messagesReceived: number;
  bytesSent: number;
  bytesReceived: number;
  connectionsActive: number;
  connectionsTotal: number;
  errorsTotal: number;
  latencyMs: number;
  uptimeSeconds: number;
}

export interface GlobalOrchestratorConfig {
  orchestratorId: string;
  discovery: DiscoveryConfig;
  healthMonitoring: HealthMonitoringConfig;
  routing: RoutingConfig;
  scaling: ScalingConfig;
  failover: FailoverConfig;
  federation: FederationIntegrationConfig;
  logger?: Logger;
  redis?: RedisConfig;
}

export interface DiscoveryConfig {
  enabled: boolean;
  serviceRegistryUrl?: string;
  discoveryInterval: number;
  heartbeatInterval: number;
  nodeTimeout: number;
  maxRetries: number;
}

export interface HealthMonitoringConfig {
  enabled: boolean;
  checkInterval: number;
  timeout: number;
  unhealthyThreshold: number;
  healthyThreshold: number;
  metricsCollectionInterval: number;
}

export interface RoutingConfig {
  algorithm: RoutingAlgorithm;
  loadBalancingStrategy: LoadBalancingStrategy;
  geoRoutingEnabled: boolean;
  latencyThreshold: number;
  capacityThreshold: number;
  adaptiveRouting: boolean;
}

export interface ScalingConfig {
  enabled: boolean;
  minNodes: number;
  maxNodes: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriod: number;
  predictiveScaling: boolean;
  metricsWindow: number;
}

export interface FailoverConfig {
  enabled: boolean;
  primaryNodeId?: string;
  backupNodes: string[];
  failoverTimeout: number;
  autoRecovery: boolean;
  dataReplication: boolean;
}

export interface FederationIntegrationConfig {
  federationManagers: FederationManagerConfig[];
  messageRoutingEnabled: boolean;
  crossFederationCommunication: boolean;
  sharedStateSync: boolean;
}

export interface FederationManagerConfig {
  federationId: string;
  endpoint: string;
  auth: {
    type: 'jwt' | 'certificate';
    token?: string;
    certPath?: string;
  };
  capabilities: string[];
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix: string;
}

export enum RoutingAlgorithm {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  WEIGHTED_ROUND_ROBIN = 'weighted_round_robin',
  LEAST_RESPONSE_TIME = 'least_response_time',
  GEOGRAPHIC = 'geographic',
  ADAPTIVE = 'adaptive'
}

export enum LoadBalancingStrategy {
  RANDOM = 'random',
  ROUND_ROBIN = 'round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  IP_HASH = 'ip_hash',
  WEIGHTED = 'weighted'
}

export interface GlobalNodeInfo extends NodeInfo {
  federationId: string;
  region: string;
  zone: string;
  loadMetrics: LoadMetrics;
  capabilities: GlobalCapability[];
  lastHealthCheck: number;
  healthStatus: HealthStatus;
}

export interface LoadMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  requestRate: number;
  errorRate: number;
  responseTime: number;
  timestamp: number;
}

export enum GlobalCapability {
  ROUTING = 'routing',
  SCALING = 'scaling',
  FAILOVER = 'failover',
  MONITORING = 'monitoring',
  FEDERATION_COORDINATION = 'federation_coordination',
  LOAD_BALANCING = 'load_balancing'
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

export interface RoutingDecision {
  targetNodeId: string;
  federationId: string;
  reason: string;
  confidence: number;
  alternatives: string[];
  timestamp: number;
}

export interface ScalingDecision {
  action: ScalingAction;
  targetNodes: string[];
  reason: string;
  expectedImpact: ScalingImpact;
  timestamp: number;
}

export enum ScalingAction {
  SCALE_UP = 'scale_up',
  SCALE_DOWN = 'scale_down',
  NO_ACTION = 'no_action'
}

export interface ScalingImpact {
  cpuReduction: number;
  memoryReduction: number;
  latencyImprovement: number;
  costChange: number;
}

export interface FailoverEvent {
  type: FailoverType;
  primaryNodeId: string;
  backupNodeId: string;
  reason: string;
  timestamp: number;
  recoveryTime?: number;
}

export enum FailoverType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  RECOVERY = 'recovery'
}

export interface GlobalMetrics extends FederationMetrics {
  orchestratorId: string;
  totalFederations: number;
  activeNodes: number;
  routingDecisions: number;
  scalingEvents: number;
  failoverEvents: number;
  crossFederationMessages: number;
  averageLatency: number;
  errorRate: number;
  uptimePercentage: number;
}

export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export class ConsoleLogger implements Logger {
  private prefix: string;

  constructor(prefix: string = '[GlobalOrchestrator]') {
    this.prefix = prefix;
  }

  info(message: string, meta?: any): void {
    console.log(`${this.prefix} ${new Date().toISOString()} INFO: ${message}`, meta || '');
  }

  warn(message: string, meta?: any): void {
    console.warn(`${this.prefix} ${new Date().toISOString()} WARN: ${message}`, meta || '');
  }

  error(message: string, error?: Error, meta?: any): void {
    console.error(`${this.prefix} ${new Date().toISOString()} ERROR: ${message}`, error?.stack || error || '', meta || '');
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${this.prefix} ${new Date().toISOString()} DEBUG: ${message}`, meta || '');
    }
  }
}

export class GlobalOrchestratorError extends Error {
  code: GlobalOrchestratorErrorCode;
  nodeId?: string;
  federationId?: string;
  details?: any;

  constructor(
    code: GlobalOrchestratorErrorCode,
    message: string,
    nodeId?: string,
    federationId?: string,
    details?: any
  ) {
    super(message);
    this.name = 'GlobalOrchestratorError';
    this.code = code;
    this.nodeId = nodeId;
    this.federationId = federationId;
    this.details = details;
  }
}

export enum GlobalOrchestratorErrorCode {
  DISCOVERY_FAILED = 'DISCOVERY_FAILED',
  HEALTH_CHECK_FAILED = 'HEALTH_CHECK_FAILED',
  ROUTING_FAILED = 'ROUTING_FAILED',
  SCALING_FAILED = 'SCALING_FAILED',
  FAILOVER_FAILED = 'FAILOVER_FAILED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  FEDERATION_INTEGRATION_ERROR = 'FEDERATION_INTEGRATION_ERROR',
  REDIS_CONNECTION_ERROR = 'REDIS_CONNECTION_ERROR'
}

export interface OrchestratorMessage extends FederationMessage {
  globalRouting: boolean;
  targetFederationId?: string;
  routingMetadata?: RoutingMetadata;
}

export interface RoutingMetadata {
  priority: number;
  ttl: number;
  routingHints: string[];
  qualityOfService: QualityOfService;
}

export enum QualityOfService {
  BEST_EFFORT = 'best_effort',
  RELIABLE = 'reliable',
  REAL_TIME = 'real_time'
}

export interface FederationState {
  federationId: string;
  nodes: GlobalNodeInfo[];
  leaderNodeId?: string;
  lastSync: number;
  capabilities: string[];
  status: FederationStatus;
}

export enum FederationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

export interface GlobalTopology {
  federations: FederationState[];
  routingTable: Map<string, RoutingDecision[]>;
  scalingPolicies: ScalingPolicy[];
  failoverGroups: FailoverGroup[];
  lastUpdated: number;
}

export interface ScalingPolicy {
  policyId: string;
  federationId: string;
  conditions: ScalingCondition[];
  actions: ScalingAction[];
  cooldownPeriod: number;
  enabled: boolean;
}

export interface ScalingCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number;
}

export interface FailoverGroup {
  groupId: string;
  primaryNodeId: string;
  backupNodeIds: string[];
  failoverStrategy: FailoverStrategy;
  healthCheckInterval: number;
}

export enum FailoverStrategy {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  LOAD_BALANCED = 'load_balanced'
}