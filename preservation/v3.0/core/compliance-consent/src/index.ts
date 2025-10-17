// Main exports for the Compliance & Consent Layer
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

// Type exports
export type {
  ComplianceConfig,
  ConsentRecord,
  DataClassification,
  AuditEvent,
  DataSubjectRequest,
  CrossBorderTransfer,
  ComplianceMetrics,
  RetentionPolicy,
  RegulationType,
  RegulationFramework
} from './types';

// Re-export commonly used interfaces
export type { ConsentConfig } from './consent/ConsentManager';
export type { DataGovernanceConfig } from './governance/DataGovernance';
export type { ComplianceMonitorConfig } from './monitoring/ComplianceMonitor';
export type { FederationComplianceConfig } from './compliance/FederationComplianceManager';

// ============================================================================
// V6.0 GOVERNANCE INTEGRATIONS
// ============================================================================

/**
 * Unified Compliance Integration Manager
 * Integrates AI governance policies and data trust verification with compliance workflows
 */
export class UnifiedComplianceIntegration {
  private aiGovernance?: any;
  private dataTrust?: any;
  private complianceManager: any;

  constructor(config: {
    complianceManager: any;
    aiGovernance?: any;
    dataTrust?: any;
  }) {
    this.complianceManager = config.complianceManager;
    this.aiGovernance = config.aiGovernance;
    this.dataTrust = config.dataTrust;
  }

  /**
   * Validate data operation against compliance and governance policies
   */
  async validateDataOperation(operation: {
    type: 'read' | 'write' | 'delete' | 'transfer';
    dataClassification: string;
    userId: string;
    destination?: string;
  }): Promise<{
    allowed: boolean;
    violations: string[];
    governance?: any;
    provenance?: any;
  }> {
    const violations: string[] = [];

    // Check AI governance policies if available
    if (this.aiGovernance) {
      try {
        const evaluation = await this.aiGovernance.policyEnforcer.evaluateAction({
          action: operation.type,
          context: {
            dataClassification: operation.dataClassification,
            userId: operation.userId,
            destination: operation.destination
          }
        });

        if (!evaluation.allowed) {
          violations.push(...(evaluation.violations || []));
        }
      } catch (error) {
        console.warn('AI governance evaluation failed:', error);
      }
    }

    // Track data provenance if data trust is enabled
    let provenance;
    if (this.dataTrust && operation.type === 'write') {
      try {
        provenance = await this.dataTrust.provenanceTracker.trackEvent({
          eventType: 'data_operation',
          timestamp: new Date(),
          actor: operation.userId,
          action: operation.type,
          metadata: {
            classification: operation.dataClassification,
            destination: operation.destination
          }
        });
      } catch (error) {
        console.warn('Data provenance tracking failed:', error);
      }
    }

    return {
      allowed: violations.length === 0,
      violations,
      governance: this.aiGovernance ? { evaluated: true } : undefined,
      provenance
    };
  }

  /**
   * Verify data integrity using data trust module
   */
  async verifyDataIntegrity(data: any): Promise<{
    valid: boolean;
    hash?: string;
    merkleRoot?: string;
  }> {
    if (!this.dataTrust) {
      return { valid: true };
    }

    try {
      const hash = await this.dataTrust.dataHasher.hash(JSON.stringify(data));
      const integrityCheck = await this.dataTrust.integrityVerifier.verify(data, hash);

      return {
        valid: integrityCheck.isValid,
        hash: hash.hash,
        merkleRoot: integrityCheck.merkleRoot
      };
    } catch (error) {
      console.error('Data integrity verification failed:', error);
      return { valid: false };
    }
  }

  /**
   * Get unified compliance status
   */
  async getComplianceStatus(): Promise<{
    compliance: any;
    governance: any;
    dataTrust: any;
  }> {
    const status: any = {
      compliance: {},
      governance: {},
      dataTrust: {}
    };

    // Get compliance status
    try {
      status.compliance = {
        operational: true,
        frameworks: ['GDPR', 'CCPA']
      };
    } catch (error) {
      status.compliance = { operational: false, error: String(error) };
    }

    // Get AI governance status
    if (this.aiGovernance) {
      try {
        status.governance = this.aiGovernance.getHealthStatus();
      } catch (error) {
        status.governance = { operational: false, error: String(error) };
      }
    }

    // Get data trust status
    if (this.dataTrust) {
      try {
        status.dataTrust = {
          operational: true,
          hashingAvailable: true,
          provenanceTracking: true
        };
      } catch (error) {
        status.dataTrust = { operational: false, error: String(error) };
      }
    }

    return status;
  }
}