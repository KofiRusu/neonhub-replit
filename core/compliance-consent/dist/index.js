"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedComplianceIntegration = exports.RegulatoryFrameworks = exports.FederationComplianceManager = exports.CrossBorderTransferManager = exports.DataSubjectRightsManager = exports.ComplianceMonitor = exports.AuditTrail = exports.DataRetentionManager = exports.DataGovernance = exports.ConsentManager = exports.ComplianceManager = void 0;
// Main exports for the Compliance & Consent Layer
var ComplianceManager_1 = require("./ComplianceManager");
Object.defineProperty(exports, "ComplianceManager", { enumerable: true, get: function () { return ComplianceManager_1.ComplianceManager; } });
var ConsentManager_1 = require("./consent/ConsentManager");
Object.defineProperty(exports, "ConsentManager", { enumerable: true, get: function () { return ConsentManager_1.ConsentManager; } });
var DataGovernance_1 = require("./governance/DataGovernance");
Object.defineProperty(exports, "DataGovernance", { enumerable: true, get: function () { return DataGovernance_1.DataGovernance; } });
var DataRetentionManager_1 = require("./governance/DataRetentionManager");
Object.defineProperty(exports, "DataRetentionManager", { enumerable: true, get: function () { return DataRetentionManager_1.DataRetentionManager; } });
var AuditTrail_1 = require("./monitoring/AuditTrail");
Object.defineProperty(exports, "AuditTrail", { enumerable: true, get: function () { return AuditTrail_1.AuditTrail; } });
var ComplianceMonitor_1 = require("./monitoring/ComplianceMonitor");
Object.defineProperty(exports, "ComplianceMonitor", { enumerable: true, get: function () { return ComplianceMonitor_1.ComplianceMonitor; } });
var DataSubjectRightsManager_1 = require("./compliance/DataSubjectRightsManager");
Object.defineProperty(exports, "DataSubjectRightsManager", { enumerable: true, get: function () { return DataSubjectRightsManager_1.DataSubjectRightsManager; } });
var CrossBorderTransferManager_1 = require("./compliance/CrossBorderTransferManager");
Object.defineProperty(exports, "CrossBorderTransferManager", { enumerable: true, get: function () { return CrossBorderTransferManager_1.CrossBorderTransferManager; } });
var FederationComplianceManager_1 = require("./compliance/FederationComplianceManager");
Object.defineProperty(exports, "FederationComplianceManager", { enumerable: true, get: function () { return FederationComplianceManager_1.FederationComplianceManager; } });
var RegulatoryFrameworks_1 = require("./compliance/RegulatoryFrameworks");
Object.defineProperty(exports, "RegulatoryFrameworks", { enumerable: true, get: function () { return RegulatoryFrameworks_1.RegulatoryFrameworks; } });
// ============================================================================
// V6.0 GOVERNANCE INTEGRATIONS
// ============================================================================
/**
 * Unified Compliance Integration Manager
 * Integrates AI governance policies and data trust verification with compliance workflows
 */
class UnifiedComplianceIntegration {
    constructor(config) {
        this.complianceManager = config.complianceManager;
        this.aiGovernance = config.aiGovernance;
        this.dataTrust = config.dataTrust;
    }
    /**
     * Validate data operation against compliance and governance policies
     */
    async validateDataOperation(operation) {
        const violations = [];
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
            }
            catch (error) {
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
            }
            catch (error) {
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
    async verifyDataIntegrity(data) {
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
        }
        catch (error) {
            console.error('Data integrity verification failed:', error);
            return { valid: false };
        }
    }
    /**
     * Get unified compliance status
     */
    async getComplianceStatus() {
        const status = {
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
        }
        catch (error) {
            status.compliance = { operational: false, error: String(error) };
        }
        // Get AI governance status
        if (this.aiGovernance) {
            try {
                status.governance = this.aiGovernance.getHealthStatus();
            }
            catch (error) {
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
            }
            catch (error) {
                status.dataTrust = { operational: false, error: String(error) };
            }
        }
        return status;
    }
}
exports.UnifiedComplianceIntegration = UnifiedComplianceIntegration;
//# sourceMappingURL=index.js.map