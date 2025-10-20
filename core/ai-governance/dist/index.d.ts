/**
 * AI Governance Module
 * Policy engine and ethical framework for autonomous governance
 *
 * @module @neonhub/ai-governance
 */
export * from './types';
export { PolicyEngine } from './core/PolicyEngine';
export { EthicalFramework } from './core/EthicalFramework';
export { PolicyEnforcer } from './core/PolicyEnforcer';
export { LegalComplianceManager } from './compliance/LegalComplianceManager';
export { AuditLogger } from './monitoring/AuditLogger';
export { AIGovernanceManager, defaultAIGovernanceConfig } from './core/AIGovernanceManager';
export type { AIGovernanceConfig } from './core/AIGovernanceManager';
export declare const VERSION = "1.0.0";
export declare const MODULE_NAME = "@neonhub/ai-governance";
//# sourceMappingURL=index.d.ts.map