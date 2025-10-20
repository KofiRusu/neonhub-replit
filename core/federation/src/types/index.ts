export interface FederationMessage {
  id: string;
  type: FederationMessageType;
  payload: any;
  timestamp: number;
  sourceNodeId: string;
  targetNodeId?: string;
  priority: MessagePriority;
  ttl?: number; // Time to live in milliseconds
}

export enum FederationMessageType {
  HEARTBEAT = 'heartbeat',
  MODEL_UPDATE = 'model_update',
  GRADIENT_UPDATE = 'gradient_update',
  MODEL_AGGREGATION = 'model_aggregation',
  PRIVACY_BUDGET_UPDATE = 'privacy_budget_update',
  PARTICIPANT_REGISTRATION = 'participant_registration',
  POISONING_DETECTION = 'poisoning_detection',
  KEY_EXCHANGE = 'key_exchange',
  SECURE_COMPUTATION = 'secure_computation',
  DATA_SHARING = 'data_sharing',
  COORDINATION = 'coordination',
  HEALTH_CHECK = 'health_check',
  ERROR_REPORT = 'error_report',
  METRICS_REPORT = 'metrics_report',
  CONFIG_UPDATE = 'config_update',
  // AIX Protocol Messages
  MODEL_SUMMARY_EXCHANGE = 'model_summary_exchange',
  INTELLIGENCE_SHARING_REQUEST = 'intelligence_sharing_request',
  KNOWLEDGE_DISTILLATION = 'knowledge_distillation',
  INTELLIGENCE_AGGREGATION = 'intelligence_aggregation',
  MODEL_VERSION_CHECK = 'model_version_check',
  PRIVACY_POLICY_UPDATE = 'privacy_policy_update',
  MARKETPLACE_BID = 'marketplace_bid',
  MODEL_EVALUATION_REQUEST = 'model_evaluation_request',
  EVALUATION_RESULT = 'evaluation_result',
  COMPRESSION_NEGOTIATION = 'compression_negotiation'
}

export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

export interface NodeInfo {
  nodeId: string;
  address: string;
  port: number;
  capabilities: NodeCapability[];
  status: NodeStatus;
  lastSeen: number;
  metadata?: Record<string, any>;
}

export enum NodeCapability {
  MODEL_TRAINING = 'model_training',
  DATA_PROCESSING = 'data_processing',
  COORDINATION = 'coordination',
  STORAGE = 'storage',
  COMPUTE = 'compute',
  FEDERATED_LEARNING = 'federated_learning',
  SECURE_COMPUTATION = 'secure_computation',
  HOMOMORPHIC_ENCRYPTION = 'homomorphic_encryption'
}

export enum NodeStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

export interface ConnectionConfig {
  host: string;
  port: number;
  tls?: TLSConfig;
  auth?: AuthConfig;
  reconnect?: ReconnectConfig;
  pool?: PoolConfig;
}

export interface TLSConfig {
  enabled: boolean;
  certPath?: string;
  keyPath?: string;
  caPath?: string;
  rejectUnauthorized?: boolean;
}

export interface AuthConfig {
  enabled: boolean;
  type: 'jwt' | 'certificate' | 'api_key';
  token?: string;
  certPath?: string;
  keyPath?: string;
  apiKey?: string;
}

export interface ReconnectConfig {
  enabled: boolean;
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface PoolConfig {
  enabled: boolean;
  minConnections: number;
  maxConnections: number;
  acquireTimeout: number;
  idleTimeout: number;
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  unhealthyThreshold: number;
  healthyThreshold: number;
}

export class FederationError extends Error {
  code: FederationErrorCode;
  nodeId?: string;
  messageId?: string;
  details?: any;

  constructor(code: FederationErrorCode, message: string, nodeId?: string, messageId?: string, details?: any) {
    super(message);
    this.name = 'FederationError';
    this.code = code;
    this.nodeId = nodeId;
    this.messageId = messageId;
    this.details = details;
  }
}

export enum FederationErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  MESSAGE_TIMEOUT = 'MESSAGE_TIMEOUT',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  NODE_UNAVAILABLE = 'NODE_UNAVAILABLE',
  TLS_ERROR = 'TLS_ERROR',
  POOL_EXHAUSTED = 'POOL_EXHAUSTED',
  HEALTH_CHECK_FAILED = 'HEALTH_CHECK_FAILED'
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

export interface GRPCServiceDefinition {
  serviceName: string;
  methods: GRPCMethodDefinition[];
}

export interface GRPCMethodDefinition {
  name: string;
  requestType: string;
  responseType: string;
  streaming?: boolean;
}

// Federated Learning Types
export interface GradientUpdate {
  layerId: string;
  gradients: number[][];
  noiseScale?: number;
  timestamp: number;
}

export interface ModelUpdate {
  modelVersion: string;
  weights: Record<string, number[][]>;
  metadata: {
    accuracy?: number;
    loss?: number;
    epoch?: number;
    datasetSize?: number;
  };
  encrypted?: boolean;
  homomorphicKeyId?: string;
}

export interface PrivacyBudget {
  epsilon: number;
  delta: number;
  usedBudget: number;
  maxBudget: number;
  lastUpdated: number;
}

export interface ParticipantInfo {
  nodeId: string;
  reputationScore: number;
  contributionCount: number;
  lastContribution: number;
  privacyBudget: PrivacyBudget;
  capabilities: NodeCapability[];
  status: ParticipantStatus;
}

export enum ParticipantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BLACKLISTED = 'blacklisted'
}

export interface AggregationConfig {
  algorithm: AggregationAlgorithm;
  minParticipants: number;
  maxParticipants: number;
  privacyBudget: PrivacyBudget;
  timeoutMs: number;
}

export enum IntelligenceAggregationAlgorithm {
  FED_AVG = 'fed_avg',
  FED_PROX = 'fed_prox',
  SECURE_AGGREGATION = 'secure_aggregation',
  ENSEMBLE_AVERAGE = 'ensemble_average',
  STACKED_GENERALIZATION = 'stacked_generalization',
  META_LEARNING_AGGREGATION = 'meta_learning_aggregation'
}

export type AggregationAlgorithm = IntelligenceAggregationAlgorithm;

export interface PoisoningDetectionResult {
  nodeId: string;
  isPoisoned: boolean;
  confidence: number;
  detectionMethod: string;
  timestamp: number;
}

export interface SecureComputationRequest {
  computationId: string;
  protocol: SecureComputationProtocol;
  participants: string[];
  inputs: Record<string, any>;
  timeoutMs: number;
}

export enum SecureComputationProtocol {
  SECRET_SHARING = 'secret_sharing',
  HOMOMORPHIC_ENCRYPTION = 'homomorphic_encryption',
  MULTI_PARTY_COMPUTATION = 'multi_party_computation'
}

export interface KeyExchangeRequest {
  keyId: string;
  algorithm: string;
  publicKey: string;
  participants: string[];
  purpose: KeyPurpose;
}

export enum KeyPurpose {
  HOMOMORPHIC_ENCRYPTION = 'homomorphic_encryption',
  SECURE_AGGREGATION = 'secure_aggregation',
  SIGNATURE_VERIFICATION = 'signature_verification'
}

// AI Intelligence Exchange (AIX) Types
export interface ModelSummary {
  modelId: string;
  version: string;
  architecture: string;
  parameters: number;
  layers: ModelLayer[];
  performance: ModelPerformance;
  metadata: ModelMetadata;
  compressed?: boolean;
  quantized?: boolean;
}

export interface ModelLayer {
  name: string;
  type: string;
  inputShape: number[];
  outputShape: number[];
  parameters: number;
  weights?: number[][];
  gradients?: number[][];
}

export interface ModelPerformance {
  accuracy: number;
  loss: number;
  f1Score?: number;
  precision?: number;
  recall?: number;
  datasetSize: number;
  trainingEpochs: number;
  validationMetrics?: Record<string, number>;
}

export interface ModelMetadata {
  framework: string;
  trainingTime: number;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  description?: string;
  license?: string;
}

export interface IntelligenceSharingRequest {
  requestId: string;
  requesterNodeId: string;
  modelId: string;
  sharingType: IntelligenceSharingType;
  privacyLevel: PrivacyLevel;
  purpose: string;
  timestamp: number;
  expiresAt?: number;
}

export enum IntelligenceSharingType {
  MODEL_SUMMARY = 'model_summary',
  GRADIENTS = 'gradients',
  WEIGHTS = 'weights',
  KNOWLEDGE_DISTILLATION = 'knowledge_distillation',
  ENSEMBLE_VOTING = 'ensemble_voting',
  META_LEARNING = 'meta_learning'
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  RESTRICTED = 'restricted',
  PRIVATE = 'private',
  CONFIDENTIAL = 'confidential'
}

export interface KnowledgeDistillationRequest {
  teacherModelId: string;
  studentModelId: string;
  temperature: number;
  alpha: number;
  distillationLoss: string;
  softTargets: boolean;
}

export interface IntelligenceAggregationRequest {
  aggregationId: string;
  modelIds: string[];
  algorithm: IntelligenceAggregationAlgorithm;
  weights?: number[];
  privacyPreserving: boolean;
  minParticipants: number;
  timeoutMs: number;
}


export interface ModelVersion {
  modelId: string;
  version: string;
  parentVersion?: string;
  compatibility: ModelCompatibility;
  changes: string[];
  breaking: boolean;
}

export interface ModelCompatibility {
  framework: string;
  minVersion: string;
  maxVersion?: string;
  supportedArchitectures: string[];
  deprecatedFeatures?: string[];
}

export interface PrivacyPolicy {
  policyId: string;
  nodeId: string;
  sharingRules: SharingRule[];
  dataRetention: number;
  auditRequired: boolean;
  consentRequired: boolean;
}

export interface SharingRule {
  dataType: IntelligenceSharingType;
  allowedRecipients: string[];
  maxRetentionTime: number;
  encryptionRequired: boolean;
  anonymizationRequired: boolean;
}

export interface IntelligenceMarketplaceBid {
  bidId: string;
  modelId: string;
  bidderNodeId: string;
  price: number;
  currency: string;
  terms: BidTerms;
  timestamp: number;
  expiresAt: number;
}

export interface BidTerms {
  accessDuration: number;
  usageRestrictions: string[];
  royaltyPercentage?: number;
  exclusivity: boolean;
}

export interface ModelEvaluationRequest {
  evaluationId: string;
  modelId: string;
  evaluatorNodeId: string;
  testDataset: string;
  metrics: string[];
  benchmarkConfig: BenchmarkConfig;
  crossValidation: boolean;
}

export interface BenchmarkConfig {
  batchSize: number;
  deviceType: string;
  precision: 'fp32' | 'fp16' | 'int8';
  timeoutMs: number;
  maxMemoryUsage?: number;
}

export interface EvaluationResult {
  evaluationId: string;
  modelId: string;
  evaluatorNodeId: string;
  metrics: Record<string, number>;
  benchmarkResults: BenchmarkResult[];
  crossValidationScores?: Record<string, number>;
  timestamp: number;
}

export interface BenchmarkResult {
  benchmarkName: string;
  score: number;
  latency: number;
  throughput: number;
  memoryUsage: number;
  deviceUtilization: number;
}

export enum AIXMessageType {
  MODEL_SUMMARY_EXCHANGE = 'model_summary_exchange',
  INTELLIGENCE_SHARING_REQUEST = 'intelligence_sharing_request',
  KNOWLEDGE_DISTILLATION = 'knowledge_distillation',
  INTELLIGENCE_AGGREGATION = 'intelligence_aggregation',
  MODEL_VERSION_CHECK = 'model_version_check',
  PRIVACY_POLICY_UPDATE = 'privacy_policy_update',
  MARKETPLACE_BID = 'marketplace_bid',
  MODEL_EVALUATION_REQUEST = 'model_evaluation_request',
  EVALUATION_RESULT = 'evaluation_result',
  COMPRESSION_NEGOTIATION = 'compression_negotiation'
}

export interface CompressionConfig {
  algorithm: CompressionAlgorithm;
  level: number;
  quantizationBits?: number;
  pruningRatio?: number;
  sparseEncoding?: boolean;
}

export enum CompressionAlgorithm {
  QUANTIZATION = 'quantization',
  PRUNING = 'pruning',
  DISTILLATION = 'distillation',
  SPARSE_CODING = 'sparse_coding',
  LOW_RANK_APPROXIMATION = 'low_rank_approximation'
}