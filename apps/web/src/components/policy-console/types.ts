/**
 * Shared Types for Policy Console
 * v6.0 Governance Control Center
 */

import type {
  GovernancePolicy,
  GovernancePolicyEvaluation,
  EthicalAssessment,
  GovernanceHealthStatus,
  ProvenanceEvent,
  IntegrityVerification,
  AuditLogEntry,
  DataTrustStatus,
  EnergyMetrics,
  CarbonFootprint,
  ResourceOptimization,
  EfficiencyAnalysis,
  GreenAIRecommendations,
  SustainabilityReport,
  EcoOptimizerStatus,
  OrchestratorNode,
  SystemHealth,
  OrchestrationMetrics,
  ScalingDecision,
  FailoverResult,
  ApiResponse
} from '../../types/governance';

// Re-export API types
export type {
  GovernancePolicy,
  GovernancePolicyEvaluation,
  EthicalAssessment,
  GovernanceHealthStatus,
  ProvenanceEvent,
  IntegrityVerification,
  AuditLogEntry,
  DataTrustStatus,
  EnergyMetrics,
  CarbonFootprint,
  ResourceOptimization,
  EfficiencyAnalysis,
  GreenAIRecommendations,
  SustainabilityReport,
  EcoOptimizerStatus,
  OrchestratorNode,
  SystemHealth,
  OrchestrationMetrics,
  ScalingDecision,
  FailoverResult,
  ApiResponse
};

// Console-specific types
export interface UnifiedGovernanceStatus {
  governance: GovernanceHealthStatus;
  dataTrust: DataTrustStatus;
  ecoOptimizer: EcoOptimizerStatus;
  orchestration: {
    operational: boolean;
    nodesActive: number;
  };
}

export interface ConsoleAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  source: 'governance' | 'data-trust' | 'eco-optimizer' | 'orchestration';
  acknowledged: boolean;
}

export interface DashboardMetrics {
  governance: {
    policiesActive: number;
    evaluationsToday: number;
    violations: number;
    complianceScore: number;
  };
  dataTrust: {
    provenanceEvents: number;
    integrityChecks: number;
    verificationRate: number;
  };
  sustainability: {
    energyUsageToday: number;
    carbonEmissionsToday: number;
    efficiencyScore: number;
    renewablePercent: number;
  };
  orchestration: {
    totalNodes: number;
    healthyNodes: number;
    activeRequests: number;
    averageLatency: number;
  };
}

export interface PolicyFormData {
  name: string;
  description: string;
  category: 'ethical' | 'legal' | 'security' | 'privacy' | 'performance' | 'compliance';
  rules: PolicyRuleFormData[];
  enabled: boolean;
  jurisdiction?: string[];
}

export interface PolicyRuleFormData {
  name: string;
  condition: string;
  action: 'allow' | 'deny' | 'review';
  priority: number;
}

export interface ProvenanceGraph {
  nodes: ProvenanceNode[];
  edges: ProvenanceEdge[];
}

export interface ProvenanceNode {
  id: string;
  label: string;
  type: 'data' | 'actor' | 'event';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ProvenanceEdge {
  source: string;
  target: string;
  label: string;
  type: string;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeMetadata?: boolean;
}