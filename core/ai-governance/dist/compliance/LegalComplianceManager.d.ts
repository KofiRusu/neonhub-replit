import { EventEmitter } from 'events';
import { LegalComplianceCheck, LegalRequirement, LegalComplianceConfig, ComplianceStatus } from '../types/index.js';
export declare class LegalComplianceManager extends EventEmitter {
    private config;
    private requirements;
    private auditLogger;
    constructor(config: LegalComplianceConfig, auditLogger?: any);
    /**
     * Initialize legal requirements for configured jurisdictions and frameworks
     */
    private initializeRequirements;
    /**
     * Perform comprehensive legal compliance check
     */
    checkCompliance(jurisdiction: string, framework?: string): Promise<LegalComplianceCheck>;
    /**
     * Evaluate a specific legal requirement
     */
    private evaluateRequirement;
    /**
     * Check data processing compliance
     */
    private checkDataProcessingCompliance;
    /**
     * Check data protection compliance
     */
    private checkDataProtectionCompliance;
    /**
     * Check data retention compliance
     */
    private checkDataRetentionCompliance;
    /**
     * Check rights management compliance
     */
    private checkRightsManagementCompliance;
    /**
     * Check transparency compliance
     */
    private checkTransparencyCompliance;
    /**
     * Check consent management compliance
     */
    private checkConsentManagementCompliance;
    /**
     * Check health data compliance
     */
    private checkHealthDataCompliance;
    /**
     * Check data security compliance
     */
    private checkDataSecurityCompliance;
    /**
     * Determine violation severity
     */
    private determineViolationSeverity;
    /**
     * Get remediation steps for a requirement
     */
    private getRemediationSteps;
    /**
     * Update compliance status for a requirement
     */
    updateRequirementStatus(framework: string, requirementId: string, status: ComplianceStatus): Promise<void>;
    /**
     * Get compliance requirements for a framework
     */
    getRequirements(framework: string): LegalRequirement[];
    /**
     * Get all supported frameworks
     */
    getSupportedFrameworks(): string[];
    /**
     * Check if compliance passes threshold
     */
    passesComplianceThreshold(check: LegalComplianceCheck): boolean;
}
//# sourceMappingURL=LegalComplianceManager.d.ts.map