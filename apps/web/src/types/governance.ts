/**
 * TypeScript Types for Governance - Frontend
 * Mirrors backend API types from apps/api/src/types/governance.ts
 */

// ============================================================================
// AI Governance Types
// ============================================================================

export interface GovernancePolicyEvaluation {
  allowed: boolean;
  violations: string[];
  recommendations: string[];
}

export interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  enabled: boolean;
}

export interface PolicyRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'review';
  priority: number;
}

export interface EthicalAssessment {
  score: number;
  concerns: string[];
  recommendations: string[];
}

export interface GovernanceHealthStatus {
  policyEngine: boolean;
  ethicalFramework: boolean;
  legalCompliance: boolean;
  auditLogger: boolean;
}

// ============================================================================
// Data Trust Types
// ============================================================================

export interface DataHashResult {
  hash: string;
  algorithm: string;
  timestamp: Date;
}

export interface IntegrityVerification {
  isValid: boolean;
  actualHash: string;
  message: string;
}

export interface ProvenanceEvent {
  eventId: string;
  eventType: string;
  dataId: string;
  actor: string;
  action: string;
  timestamp: Date;
  hash: string;
  metadata?: Record<string, unknown>;
}

export interface ProvenanceChainVerification {
  isValid: boolean;
  eventCount: number;
  message: string;
}

export interface MerkleTreeResult {
  root: string;
  leafCount: number;
}

export interface AuditLogEntry {
  level: 'info' | 'warn' | 'error' | 'critical';
  category: string;
  action: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface DataTrustStatus {
  dataHasher: boolean;
  provenanceTracker: boolean;
  integrityVerifier: boolean;
  auditTrail: boolean;
}

// ============================================================================
// Eco-Optimizer Types
// ============================================================================

export interface EnergyMetrics {
  totalEnergy: number;
  energyByProvider: Record<string, number>;
  timestamp: Date;
}

export interface CarbonFootprint {
  totalCarbon: number;
  carbonByProvider: Record<string, number>;
  recommendations: string[];
}

export interface ResourceOptimization {
  optimized: boolean;
  savings: {
    energy: number;
    cost: number;
    carbon: number;
  };
  recommendations: OptimizationRecommendation[];
}

export interface OptimizationRecommendation {
  action: string;
  impact: 'high' | 'medium' | 'low';
  estimatedSavings: number;
}

export interface EfficiencyAnalysis {
  overallScore: number;
  metrics: EfficiencyMetrics;
  inefficiencies: Inefficiency[];
  recommendations: OptimizationRecommendation[];
}

export interface EfficiencyMetrics {
  cpuEfficiency: number;
  memoryEfficiency: number;
  networkEfficiency: number;
  storageEfficiency: number;
}

export interface Inefficiency {
  type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  location: string;
}

export interface GreenAIRecommendations {
  score: number;
  recommendations: GreenAIRecommendation[];
  estimatedSavings: {
    energy: number;
    carbon: number;
    cost: number;
  };
}

export interface GreenAIRecommendation {
  action: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SustainabilityReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: SustainabilitySummary;
  metrics: SustainabilityMetrics;
  achievements: Achievement[];
  recommendations: OptimizationRecommendation[];
}

export interface SustainabilitySummary {
  totalEnergyUsed: number;
  totalCarbonEmitted: number;
  costSavings: number;
  efficiencyScore: number;
}

export interface SustainabilityMetrics {
  energy: EnergyMetrics;
  carbon: CarbonFootprint;
  efficiency: EfficiencyMetrics;
}

export interface Achievement {
  title: string;
  description: string;
  date: Date;
  impact: string;
}

export interface EnergyUsageTracking {
  energyKWh: number;
  carbonKg: number;
  cost: number;
}

export interface EcoOptimizerStatus {
  energyMonitor: boolean;
  carbonCalculator: boolean;
  resourceOptimizer: boolean;
  efficiencyAnalyzer: boolean;
  greenAIAdvisor: boolean;
  sustainabilityReporter: boolean;
}

// ============================================================================
// Global Orchestration Types
// ============================================================================

export interface OrchestratorNode {
  id: string;
  region: string;
  endpoint: string;
  capabilities: string[];
  metadata?: Record<string, unknown>;
  status?: 'active' | 'inactive' | 'degraded';
}

export interface RequestRouting {
  requestId: string;
  sourceRegion: string;
  priority: 'low' | 'medium' | 'high';
  payload: unknown;
}

export interface RoutingResult {
  targetNode: OrchestratorNode;
  route: RouteInfo;
  latency: number;
}

export interface RouteInfo {
  path: string[];
  estimatedLatency: number;
  cost: number;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  nodes: NodeHealth[];
  metrics: SystemMetrics;
}

export interface NodeHealth {
  nodeId: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  metrics: NodeMetrics;
}

export interface NodeMetrics {
  cpuUtilization: number;
  memoryUtilization: number;
  requestRate: number;
}

export interface SystemMetrics {
  totalNodes: number;
  healthyNodes: number;
  totalRequests: number;
  averageLatency: number;
}

export interface ScalingDecision {
  action: 'scale-up' | 'scale-down' | 'maintain';
  currentReplicas: number;
  targetReplicas: number;
  reason: string;
}

export interface FailoverResult {
  success: boolean;
  backupNode: OrchestratorNode;
  message: string;
}

export interface OrchestrationMetrics {
  totalNodes: number;
  healthyNodes: number;
  activeRequests: number;
  totalRequestsHandled: number;
  averageLatency: number;
}

// ============================================================================
// Unified Integration Types
// ============================================================================

export interface UnifiedGovernanceStatus {
  governance: GovernanceHealthStatus;
  dataTrust: DataTrustStatus;
  ecoOptimizer: EcoOptimizerStatus;
  orchestration: {
    operational: boolean;
    nodesActive: number;
  };
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;