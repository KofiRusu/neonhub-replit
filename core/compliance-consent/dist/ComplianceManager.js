import { RegulatoryFrameworks } from './compliance/RegulatoryFrameworks';
import { ConsentManager } from './consent/ConsentManager';
import { DataGovernance } from './governance/DataGovernance';
import { DataRetentionManager } from './governance/DataRetentionManager';
import { AuditTrail } from './monitoring/AuditTrail';
import { ComplianceMonitor } from './monitoring/ComplianceMonitor';
import { DataSubjectRightsManager } from './compliance/DataSubjectRightsManager';
import { CrossBorderTransferManager } from './compliance/CrossBorderTransferManager';
export class ComplianceManager {
    constructor(config) {
        this.config = config;
        this.regulatoryFrameworks = RegulatoryFrameworks;
        this.consentManager = new ConsentManager({
            storage: 'encrypted',
            retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
            requiredPurposes: ['data_processing', 'analytics'],
            consentTypes: ['explicit', 'implicit']
        });
        this.dataGovernance = new DataGovernance({
            classificationLevels: ['public', 'internal', 'confidential', 'restricted'],
            retentionPolicies: {},
            encryptionRequired: true,
            crossBorderControls: true
        });
        this.retentionManager = new DataRetentionManager();
        this.auditTrail = new AuditTrail();
        this.complianceMonitor = new ComplianceMonitor({
            monitoringInterval: config.monitoringInterval,
            alertThresholds: config.alertThresholds,
            reportRetention: 90 * 24 * 60 * 60 * 1000 // 90 days
        });
        this.dataSubjectRights = new DataSubjectRightsManager();
        this.crossBorderManager = new CrossBorderTransferManager();
        if (config.federationEnabled) {
            // Initialize federation compliance when federation manager is available
            // this.federationCompliance = new FederationComplianceManager({
            //   federationManager: federationManager,
            //   enablePrivacyPreserving: true,
            //   enableAuditSync: true,
            //   crossBorderCompliance: true
            // });
        }
    }
    async initialize() {
        // Initialize all components
        console.log('[COMPLIANCE] Initializing compliance layer...');
        // Set up retention policies
        this.setupRetentionPolicies();
        // Initialize monitoring
        this.startMonitoring();
        console.log('[COMPLIANCE] Compliance layer initialized successfully');
    }
    setupRetentionPolicies() {
        // Set up default retention policies based on regulations
        for (const framework of RegulatoryFrameworks.getAllFrameworks()) {
            for (const [key, policy] of Object.entries(framework.retentionRules)) {
                this.retentionManager.setRetentionPolicy(key, policy);
            }
        }
    }
    startMonitoring() {
        // Set up periodic compliance checks
        setInterval(async () => {
            await this.performComplianceCheck();
        }, this.config.monitoringInterval);
    }
    async performComplianceCheck() {
        const violations = [];
        // Check consent compliance
        const expiredConsents = await this.consentManager.getExpiredConsents();
        if (expiredConsents.length > 0) {
            violations.push(`${expiredConsents.length} expired consents found`);
        }
        // Check retention compliance
        const dataForDeletion = this.dataGovernance.getDataForDeletion();
        if (dataForDeletion.length > 0) {
            violations.push(`${dataForDeletion.length} data items exceed retention period`);
        }
        // Update compliance metrics
        this.complianceMonitor.updateMetrics({
            violations: violations.length,
            expiredConsents: expiredConsents.length
        });
        // Log violations
        for (const violation of violations) {
            this.auditTrail.logEvent('compliance_violation', 'system', undefined, { violation }, {
                regulation: 'general',
                requirement: 'ongoing_compliance',
                status: 'violation'
            });
        }
    }
    // Consent Management
    async grantConsent(userId, purposes, consentTypes, expiresAt) {
        return this.consentManager.grantConsent(userId, purposes, consentTypes, expiresAt);
    }
    async checkConsent(userId, purpose) {
        return this.consentManager.checkConsent(userId, purpose);
    }
    // Data Governance
    classifyData(dataId, content, category, sensitivity = 1) {
        return this.dataGovernance.classifyData(dataId, content, category, sensitivity);
    }
    checkCrossBorderCompliance(sourceRegion, destinationRegion, dataId) {
        return this.dataGovernance.checkCrossBorderCompliance(sourceRegion, destinationRegion, dataId);
    }
    // Data Subject Rights
    async submitDataSubjectRequest(userId, type, justification) {
        return this.dataSubjectRights.submitRequest(userId, type, justification);
    }
    async handleAccessRequest(userId) {
        return this.dataSubjectRights.handleAccessRequest(userId);
    }
    async handleErasureRequest(userId) {
        return this.dataSubjectRights.handleErasureRequest(userId);
    }
    // Cross-border Transfers
    async initiateTransfer(sourceRegion, destinationRegion, dataClassification, legalBasis, safeguards) {
        return this.crossBorderManager.initiateTransfer(sourceRegion, destinationRegion, dataClassification, legalBasis, safeguards);
    }
    // Audit & Monitoring
    logAuditEvent(action, resource, userId, details, compliance) {
        return this.auditTrail.logEvent(action, resource, userId, details, compliance);
    }
    getComplianceMetrics() {
        return this.complianceMonitor.getComplianceMetrics();
    }
    getActiveAlerts() {
        return this.complianceMonitor.getActiveAlerts();
    }
    generateComplianceReport(startDate, endDate) {
        return this.complianceMonitor.generateComplianceReport(startDate, endDate);
    }
    // Federation Integration
    getFederationComplianceReport() {
        return this.federationCompliance?.getFederationComplianceReport();
    }
    // Utility methods
    validateCompliance(data, regulations) {
        return RegulatoryFrameworks.validateCompliance(data, regulations);
    }
    getAuditEvents(filters, limit) {
        return this.auditTrail.getEvents(filters, limit);
    }
    getComplianceViolations(regulation, limit) {
        return this.auditTrail.getComplianceViolations(regulation, limit);
    }
}
//# sourceMappingURL=ComplianceManager.js.map