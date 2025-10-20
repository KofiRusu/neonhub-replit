"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIGovernanceManager = exports.defaultAIGovernanceConfig = void 0;
const PolicyEngine_1 = require("./PolicyEngine");
const EthicalFramework_1 = require("./EthicalFramework");
const PolicyEnforcer_1 = require("./PolicyEnforcer");
const LegalComplianceManager_1 = require("../compliance/LegalComplianceManager");
const AuditLogger_1 = require("../monitoring/AuditLogger");
exports.defaultAIGovernanceConfig = {
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
        escalationThreshold: 'MAJOR'
    },
    legalCompliance: {
        jurisdictions: ['US', 'EU', 'GLOBAL'],
        frameworks: ['GDPR', 'CCPA', 'SOC2'],
        updateFrequency: 30,
        alertThreshold: 'REGULATORY'
    }
};
class AIGovernanceManager {
    constructor(config = exports.defaultAIGovernanceConfig) {
        this.config = { ...exports.defaultAIGovernanceConfig, ...config };
        // Initialize components
        this.auditLogger = new AuditLogger_1.AuditLogger();
        this.policyEngine = new PolicyEngine_1.PolicyEngine(this.config.policyEngine, this.auditLogger);
        this.ethicalFramework = new EthicalFramework_1.EthicalFramework(this.config.ethicalFramework, this.auditLogger);
        this.legalComplianceManager = new LegalComplianceManager_1.LegalComplianceManager(this.config.legalCompliance);
        this.policyEnforcer = new PolicyEnforcer_1.PolicyEnforcer(this.policyEngine, this.ethicalFramework, this.legalComplianceManager, this.auditLogger);
    }
    async initialize() {
        // Initialize any async components if needed
        // For now, components are initialized in constructor
    }
    async shutdown() {
        // Clean up resources
    }
    getHealthStatus() {
        return {
            policyEngine: true,
            ethicalFramework: true,
            legalCompliance: true,
            auditLogger: true
        };
    }
}
exports.AIGovernanceManager = AIGovernanceManager;
//# sourceMappingURL=AIGovernanceManager.js.map