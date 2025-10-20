import { PolicyEngine } from './PolicyEngine';
import { EthicalFramework } from './EthicalFramework';
import { PolicyEnforcer } from './PolicyEnforcer';
import { LegalComplianceManager } from '../compliance/LegalComplianceManager';
import { AuditLogger } from '../monitoring/AuditLogger';
import {
  PolicyEngineConfig,
  EthicalFrameworkConfig,
  LegalComplianceConfig
} from '../types/index.js';

export interface AIGovernanceConfig {
  policyEngine: PolicyEngineConfig;
  ethicalFramework: EthicalFrameworkConfig;
  legalCompliance: LegalComplianceConfig;
  auditLevel?: 'basic' | 'detailed' | 'comprehensive';
}

export const defaultAIGovernanceConfig: AIGovernanceConfig = {
  policyEngine: {
    enableDynamicUpdates: true,
    auditLevel: 'detailed',
    complianceCheckInterval: 60,
    maxAuditRetention: 90,
    jurisdictions: ['US', 'EU', 'GLOBAL']
  },
  ethicalFramework: {
    principles: [],
    assessmentThreshold: 0.7,
    reviewCycle: 30,
    escalationThreshold: 'MAJOR' as any
  },
  legalCompliance: {
    jurisdictions: ['US', 'EU', 'GLOBAL'],
    frameworks: ['GDPR', 'CCPA', 'SOC2'],
    updateFrequency: 30,
    alertThreshold: 'REGULATORY' as any
  }
};

export class AIGovernanceManager {
  public policyEngine: PolicyEngine;
  public ethicalFramework: EthicalFramework;
  public policyEnforcer: PolicyEnforcer;
  public legalComplianceManager: LegalComplianceManager;
  public auditLogger: AuditLogger;
  private config: AIGovernanceConfig;

  constructor(config: AIGovernanceConfig = defaultAIGovernanceConfig) {
    this.config = { ...defaultAIGovernanceConfig, ...config };
    
    // Initialize components
    this.auditLogger = new AuditLogger();
    this.policyEngine = new PolicyEngine(this.config.policyEngine, this.auditLogger);
    this.ethicalFramework = new EthicalFramework(this.config.ethicalFramework, this.auditLogger);
    this.legalComplianceManager = new LegalComplianceManager(this.config.legalCompliance);
    this.policyEnforcer = new PolicyEnforcer(
      this.policyEngine,
      this.ethicalFramework,
      this.legalComplianceManager,
      this.auditLogger
    );
  }

  async initialize(): Promise<void> {
    // Initialize any async components if needed
    // For now, components are initialized in constructor
  }

  async shutdown(): Promise<void> {
    // Clean up resources
  }

  getHealthStatus(): {
    policyEngine: boolean;
    ethicalFramework: boolean;
    legalCompliance: boolean;
    auditLogger: boolean;
  } {
    return {
      policyEngine: true,
      ethicalFramework: true,
      legalCompliance: true,
      auditLogger: true
    };
  }
}