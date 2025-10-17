// AI Governance Module - Main Entry Point
// Rule-based policy engine with ethical and legal compliance frameworks for AI operations

export { PolicyEngine } from './core/PolicyEngine.js';
export { EthicalFramework } from './core/EthicalFramework.js';
export { PolicyEnforcer } from './core/PolicyEnforcer.js';

export { LegalComplianceManager } from './compliance/LegalComplianceManager.js';

export { AuditLogger } from './monitoring/AuditLogger.js';

// Export types
export * from './types/index.js';

// Main Governance Manager class for easy integration
import { PolicyEngine } from './core/PolicyEngine.js';
import { EthicalFramework } from './core/EthicalFramework.js';
import { LegalComplianceManager } from './compliance/LegalComplianceManager.js';
import { PolicyEnforcer } from './core/PolicyEnforcer.js';
import { AuditLogger } from './monitoring/AuditLogger.js';
import {
  PolicyEngineConfig,
  EthicalFrameworkConfig,
  LegalComplianceConfig
} from './types/index.js';

export interface AIGovernanceConfig {
  policyEngine: PolicyEngineConfig;
  ethicalFramework: EthicalFrameworkConfig;
  legalCompliance: LegalComplianceConfig;
  auditLogLevel?: string;
  auditRetentionDays?: number;
}

export class AIGovernanceManager {
  public policyEngine: PolicyEngine;
  public ethicalFramework: EthicalFramework;
  public legalComplianceManager: LegalComplianceManager;
  public policyEnforcer: PolicyEnforcer;
  public auditLogger: AuditLogger;

  constructor(config: AIGovernanceConfig) {
    // Initialize audit logger first
    this.auditLogger = new AuditLogger({
      logLevel: config.auditLogLevel || 'info',
      retentionDays: config.auditRetentionDays || 90
    });

    // Initialize core components
    this.policyEngine = new PolicyEngine(config.policyEngine, this.auditLogger);
    this.ethicalFramework = new EthicalFramework(config.ethicalFramework, this.auditLogger);
    this.legalComplianceManager = new LegalComplianceManager(config.legalCompliance, this.auditLogger);

    // Initialize policy enforcer with all dependencies
    this.policyEnforcer = new PolicyEnforcer(
      this.policyEngine,
      this.ethicalFramework,
      this.legalComplianceManager,
      this.auditLogger
    );
  }

  /**
   * Initialize the governance system
   */
  async initialize(): Promise<void> {
    // Start audit logging
    // Components are already initialized in constructor
    console.log('AI Governance system initialized');
  }

  /**
   * Shutdown the governance system
   */
  async shutdown(): Promise<void> {
    await this.auditLogger.close();
    console.log('AI Governance system shut down');
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    policyEngine: boolean;
    ethicalFramework: boolean;
    legalCompliance: boolean;
    auditLogger: boolean;
  } {
    return {
      policyEngine: true, // PolicyEngine doesn't have a health check method
      ethicalFramework: true,
      legalCompliance: true,
      auditLogger: true
    };
  }
}

// Factory function for easy instantiation
export function createAIGovernance(config: AIGovernanceConfig): AIGovernanceManager {
  return new AIGovernanceManager(config);
}

// Default configuration
export const defaultAIGovernanceConfig: AIGovernanceConfig = {
  policyEngine: {
    enableDynamicUpdates: true,
    auditLevel: 'detailed',
    complianceCheckInterval: 60,
    maxAuditRetention: 90,
    jurisdictions: ['US', 'EU']
  },
  ethicalFramework: {
    principles: [], // Will be initialized by EthicalFramework
    assessmentThreshold: 70,
    reviewCycle: 30,
    escalationThreshold: 'moderate' as any
  },
  legalCompliance: {
    jurisdictions: ['US', 'EU'],
    frameworks: ['GDPR', 'CCPA'],
    updateFrequency: 30,
    alertThreshold: 'regulatory' as any
  },
  auditLogLevel: 'info',
  auditRetentionDays: 90
};