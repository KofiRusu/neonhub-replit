export { ComplianceManager } from './ComplianceManager';
export { ConsentManager } from './consent/ConsentManager';
export { DataGovernance } from './governance/DataGovernance';
export { DataRetentionManager } from './governance/DataRetentionManager';
export { AuditTrail } from './monitoring/AuditTrail';
export { ComplianceMonitor } from './monitoring/ComplianceMonitor';
export { DataSubjectRightsManager } from './compliance/DataSubjectRightsManager';
export { CrossBorderTransferManager } from './compliance/CrossBorderTransferManager';
export { FederationComplianceManager } from './compliance/FederationComplianceManager';
export { RegulatoryFrameworks } from './compliance/RegulatoryFrameworks';
export type { ComplianceConfig, ConsentRecord, DataClassification, AuditEvent, DataSubjectRequest, CrossBorderTransfer, ComplianceMetrics, RetentionPolicy, RegulationType, RegulationFramework } from './types';
export type { ConsentConfig } from './consent/ConsentManager';
export type { DataGovernanceConfig } from './governance/DataGovernance';
export type { ComplianceMonitorConfig } from './monitoring/ComplianceMonitor';
export type { FederationComplianceConfig } from './compliance/FederationComplianceManager';
/**
 * Unified Compliance Integration Manager
 * Integrates AI governance policies and data trust verification with compliance workflows
 */
export declare class UnifiedComplianceIntegration {
    private aiGovernance?;
    private dataTrust?;
    private complianceManager;
    constructor(config: {
        complianceManager: any;
        aiGovernance?: any;
        dataTrust?: any;
    });
    /**
     * Validate data operation against compliance and governance policies
     */
    validateDataOperation(operation: {
        type: 'read' | 'write' | 'delete' | 'transfer';
        dataClassification: string;
        userId: string;
        destination?: string;
    }): Promise<{
        allowed: boolean;
        violations: string[];
        governance?: any;
        provenance?: any;
    }>;
    /**
     * Verify data integrity using data trust module
     */
    verifyDataIntegrity(data: any): Promise<{
        valid: boolean;
        hash?: string;
        merkleRoot?: string;
    }>;
    /**
     * Get unified compliance status
     */
    getComplianceStatus(): Promise<{
        compliance: any;
        governance: any;
        dataTrust: any;
    }>;
}
//# sourceMappingURL=index.d.ts.map