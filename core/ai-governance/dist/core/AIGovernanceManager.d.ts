import { PolicyEngine } from './PolicyEngine';
import { EthicalFramework } from './EthicalFramework';
import { PolicyEnforcer } from './PolicyEnforcer';
import { LegalComplianceManager } from '../compliance/LegalComplianceManager';
import { AuditLogger } from '../monitoring/AuditLogger';
import { PolicyEngineConfig, EthicalFrameworkConfig, LegalComplianceConfig } from '../types/index.js';
export interface AIGovernanceConfig {
    policyEngine: PolicyEngineConfig;
    ethicalFramework: EthicalFrameworkConfig;
    legalCompliance: LegalComplianceConfig;
    auditLevel?: 'basic' | 'detailed' | 'comprehensive';
}
export declare const defaultAIGovernanceConfig: AIGovernanceConfig;
export declare class AIGovernanceManager {
    policyEngine: PolicyEngine;
    ethicalFramework: EthicalFramework;
    policyEnforcer: PolicyEnforcer;
    legalComplianceManager: LegalComplianceManager;
    auditLogger: AuditLogger;
    private config;
    constructor(config?: AIGovernanceConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    getHealthStatus(): {
        policyEngine: boolean;
        ethicalFramework: boolean;
        legalCompliance: boolean;
        auditLogger: boolean;
    };
}
//# sourceMappingURL=AIGovernanceManager.d.ts.map