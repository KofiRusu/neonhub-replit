"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceError = exports.PolicyViolationError = exports.GovernanceError = exports.LegalSeverity = exports.EthicalSeverity = exports.ComplianceStatus = exports.SubjectType = exports.AuditResult = exports.AuditAction = exports.RiskLevel = exports.ActionSeverity = exports.ActionType = exports.ConditionOperator = exports.ConditionType = exports.PolicyStatus = exports.PolicyCategory = void 0;
var PolicyCategory;
(function (PolicyCategory) {
    PolicyCategory["ETHICAL"] = "ethical";
    PolicyCategory["LEGAL"] = "legal";
    PolicyCategory["SECURITY"] = "security";
    PolicyCategory["PRIVACY"] = "privacy";
    PolicyCategory["PERFORMANCE"] = "performance";
    PolicyCategory["COMPLIANCE"] = "compliance";
})(PolicyCategory || (exports.PolicyCategory = PolicyCategory = {}));
var PolicyStatus;
(function (PolicyStatus) {
    PolicyStatus["DRAFT"] = "draft";
    PolicyStatus["ACTIVE"] = "active";
    PolicyStatus["DEPRECATED"] = "deprecated";
    PolicyStatus["ARCHIVED"] = "archived";
})(PolicyStatus || (exports.PolicyStatus = PolicyStatus = {}));
var ConditionType;
(function (ConditionType) {
    ConditionType["ATTRIBUTE"] = "attribute";
    ConditionType["METRIC"] = "metric";
    ConditionType["TIME"] = "time";
    ConditionType["LOCATION"] = "location";
    ConditionType["USER"] = "user";
    ConditionType["SYSTEM"] = "system";
})(ConditionType || (exports.ConditionType = ConditionType = {}));
var ConditionOperator;
(function (ConditionOperator) {
    ConditionOperator["EQUALS"] = "equals";
    ConditionOperator["NOT_EQUALS"] = "not_equals";
    ConditionOperator["GREATER_THAN"] = "greater_than";
    ConditionOperator["LESS_THAN"] = "less_than";
    ConditionOperator["CONTAINS"] = "contains";
    ConditionOperator["NOT_CONTAINS"] = "not_contains";
    ConditionOperator["REGEX"] = "regex";
    ConditionOperator["IN"] = "in";
    ConditionOperator["NOT_IN"] = "not_in";
})(ConditionOperator || (exports.ConditionOperator = ConditionOperator = {}));
var ActionType;
(function (ActionType) {
    ActionType["ALLOW"] = "allow";
    ActionType["DENY"] = "deny";
    ActionType["LOG"] = "log";
    ActionType["ALERT"] = "alert";
    ActionType["QUARANTINE"] = "quarantine";
    ActionType["THROTTLE"] = "throttle";
    ActionType["NOTIFY"] = "notify";
})(ActionType || (exports.ActionType = ActionType = {}));
var ActionSeverity;
(function (ActionSeverity) {
    ActionSeverity["LOW"] = "low";
    ActionSeverity["MEDIUM"] = "medium";
    ActionSeverity["HIGH"] = "high";
    ActionSeverity["CRITICAL"] = "critical";
})(ActionSeverity || (exports.ActionSeverity = ActionSeverity = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "low";
    RiskLevel["MEDIUM"] = "medium";
    RiskLevel["HIGH"] = "high";
    RiskLevel["CRITICAL"] = "critical";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["POLICY_EVALUATION"] = "policy_evaluation";
    AuditAction["RULE_TRIGGERED"] = "rule_triggered";
    AuditAction["COMPLIANCE_CHECK"] = "compliance_check";
    AuditAction["VIOLATION_DETECTED"] = "violation_detected";
    AuditAction["POLICY_UPDATE"] = "policy_update";
    AuditAction["SYSTEM_ACCESS"] = "system_access";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AuditResult;
(function (AuditResult) {
    AuditResult["ALLOWED"] = "allowed";
    AuditResult["DENIED"] = "denied";
    AuditResult["WARNING"] = "warning";
    AuditResult["ERROR"] = "error";
})(AuditResult || (exports.AuditResult = AuditResult = {}));
var SubjectType;
(function (SubjectType) {
    SubjectType["USER"] = "user";
    SubjectType["SYSTEM"] = "system";
    SubjectType["MODEL"] = "model";
    SubjectType["DATASET"] = "dataset";
    SubjectType["REQUEST"] = "request";
    SubjectType["RESPONSE"] = "response";
})(SubjectType || (exports.SubjectType = SubjectType = {}));
var ComplianceStatus;
(function (ComplianceStatus) {
    ComplianceStatus["COMPLIANT"] = "compliant";
    ComplianceStatus["NON_COMPLIANT"] = "non_compliant";
    ComplianceStatus["PARTIAL"] = "partial";
    ComplianceStatus["UNKNOWN"] = "unknown";
})(ComplianceStatus || (exports.ComplianceStatus = ComplianceStatus = {}));
var EthicalSeverity;
(function (EthicalSeverity) {
    EthicalSeverity["MINOR"] = "minor";
    EthicalSeverity["MODERATE"] = "moderate";
    EthicalSeverity["MAJOR"] = "major";
    EthicalSeverity["CRITICAL"] = "critical";
})(EthicalSeverity || (exports.EthicalSeverity = EthicalSeverity = {}));
var LegalSeverity;
(function (LegalSeverity) {
    LegalSeverity["CIVIL"] = "civil";
    LegalSeverity["CRIMINAL"] = "criminal";
    LegalSeverity["REGULATORY"] = "regulatory";
})(LegalSeverity || (exports.LegalSeverity = LegalSeverity = {}));
class GovernanceError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'GovernanceError';
    }
}
exports.GovernanceError = GovernanceError;
class PolicyViolationError extends GovernanceError {
    constructor(policyId, ruleId, details) {
        super(`Policy violation: ${policyId} - ${ruleId}`, 'POLICY_VIOLATION', details);
        this.name = 'PolicyViolationError';
    }
}
exports.PolicyViolationError = PolicyViolationError;
class ComplianceError extends GovernanceError {
    constructor(message, jurisdiction, details) {
        super(message, 'COMPLIANCE_ERROR', { jurisdiction, ...details });
        this.name = 'ComplianceError';
    }
}
exports.ComplianceError = ComplianceError;
//# sourceMappingURL=index.js.map