"use strict";
/**
 * AI Governance Module
 * Policy engine and ethical framework for autonomous governance
 *
 * @module @neonhub/ai-governance
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODULE_NAME = exports.VERSION = exports.defaultAIGovernanceConfig = exports.AIGovernanceManager = exports.AuditLogger = exports.LegalComplianceManager = exports.PolicyEnforcer = exports.EthicalFramework = exports.PolicyEngine = void 0;
// Export types
__exportStar(require("./types"), exports);
// Export components
var PolicyEngine_1 = require("./core/PolicyEngine");
Object.defineProperty(exports, "PolicyEngine", { enumerable: true, get: function () { return PolicyEngine_1.PolicyEngine; } });
var EthicalFramework_1 = require("./core/EthicalFramework");
Object.defineProperty(exports, "EthicalFramework", { enumerable: true, get: function () { return EthicalFramework_1.EthicalFramework; } });
var PolicyEnforcer_1 = require("./core/PolicyEnforcer");
Object.defineProperty(exports, "PolicyEnforcer", { enumerable: true, get: function () { return PolicyEnforcer_1.PolicyEnforcer; } });
var LegalComplianceManager_1 = require("./compliance/LegalComplianceManager");
Object.defineProperty(exports, "LegalComplianceManager", { enumerable: true, get: function () { return LegalComplianceManager_1.LegalComplianceManager; } });
var AuditLogger_1 = require("./monitoring/AuditLogger");
Object.defineProperty(exports, "AuditLogger", { enumerable: true, get: function () { return AuditLogger_1.AuditLogger; } });
var AIGovernanceManager_1 = require("./core/AIGovernanceManager");
Object.defineProperty(exports, "AIGovernanceManager", { enumerable: true, get: function () { return AIGovernanceManager_1.AIGovernanceManager; } });
Object.defineProperty(exports, "defaultAIGovernanceConfig", { enumerable: true, get: function () { return AIGovernanceManager_1.defaultAIGovernanceConfig; } });
// Version information
exports.VERSION = '1.0.0';
exports.MODULE_NAME = '@neonhub/ai-governance';
//# sourceMappingURL=index.js.map