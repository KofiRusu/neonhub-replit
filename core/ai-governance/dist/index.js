/**
 * AI Governance Module
 * Policy engine and ethical framework for autonomous governance
 *
 * @module @neonhub/ai-governance
 */
// Export types
export * from './types';
// Export components
export { PolicyEngine } from './core/PolicyEngine';
export { EthicalFramework } from './core/EthicalFramework';
export { PolicyEnforcer } from './core/PolicyEnforcer';
export { LegalComplianceManager } from './compliance/LegalComplianceManager';
export { AuditLogger } from './monitoring/AuditLogger';
export { AIGovernanceManager, defaultAIGovernanceConfig } from './core/AIGovernanceManager';
// Version information
export const VERSION = '1.0.0';
export const MODULE_NAME = '@neonhub/ai-governance';
//# sourceMappingURL=index.js.map