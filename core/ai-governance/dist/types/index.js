export var PolicyCategory;
(function (PolicyCategory) {
    PolicyCategory["ETHICAL"] = "ethical";
    PolicyCategory["LEGAL"] = "legal";
    PolicyCategory["SECURITY"] = "security";
    PolicyCategory["PRIVACY"] = "privacy";
    PolicyCategory["PERFORMANCE"] = "performance";
    PolicyCategory["COMPLIANCE"] = "compliance";
})(PolicyCategory || (PolicyCategory = {}));
export var PolicyStatus;
(function (PolicyStatus) {
    PolicyStatus["DRAFT"] = "draft";
    PolicyStatus["ACTIVE"] = "active";
    PolicyStatus["DEPRECATED"] = "deprecated";
    PolicyStatus["ARCHIVED"] = "archived";
})(PolicyStatus || (PolicyStatus = {}));
export var ConditionType;
(function (ConditionType) {
    ConditionType["ATTRIBUTE"] = "attribute";
    ConditionType["METRIC"] = "metric";
    ConditionType["TIME"] = "time";
    ConditionType["LOCATION"] = "location";
    ConditionType["USER"] = "user";
    ConditionType["SYSTEM"] = "system";
})(ConditionType || (ConditionType = {}));
export var ConditionOperator;
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
})(ConditionOperator || (ConditionOperator = {}));
export var ActionType;
(function (ActionType) {
    ActionType["ALLOW"] = "allow";
    ActionType["DENY"] = "deny";
    ActionType["LOG"] = "log";
    ActionType["ALERT"] = "alert";
    ActionType["QUARANTINE"] = "quarantine";
    ActionType["THROTTLE"] = "throttle";
    ActionType["NOTIFY"] = "notify";
})(ActionType || (ActionType = {}));
export var ActionSeverity;
(function (ActionSeverity) {
    ActionSeverity["LOW"] = "low";
    ActionSeverity["MEDIUM"] = "medium";
    ActionSeverity["HIGH"] = "high";
    ActionSeverity["CRITICAL"] = "critical";
})(ActionSeverity || (ActionSeverity = {}));
export var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "low";
    RiskLevel["MEDIUM"] = "medium";
    RiskLevel["HIGH"] = "high";
    RiskLevel["CRITICAL"] = "critical";
})(RiskLevel || (RiskLevel = {}));
export var AuditAction;
(function (AuditAction) {
    AuditAction["POLICY_EVALUATION"] = "policy_evaluation";
    AuditAction["RULE_TRIGGERED"] = "rule_triggered";
    AuditAction["COMPLIANCE_CHECK"] = "compliance_check";
    AuditAction["VIOLATION_DETECTED"] = "violation_detected";
    AuditAction["POLICY_UPDATE"] = "policy_update";
    AuditAction["SYSTEM_ACCESS"] = "system_access";
})(AuditAction || (AuditAction = {}));
export var AuditResult;
(function (AuditResult) {
    AuditResult["ALLOWED"] = "allowed";
    AuditResult["DENIED"] = "denied";
    AuditResult["WARNING"] = "warning";
    AuditResult["ERROR"] = "error";
})(AuditResult || (AuditResult = {}));
export var SubjectType;
(function (SubjectType) {
    SubjectType["USER"] = "user";
    SubjectType["SYSTEM"] = "system";
    SubjectType["MODEL"] = "model";
    SubjectType["DATASET"] = "dataset";
    SubjectType["REQUEST"] = "request";
    SubjectType["RESPONSE"] = "response";
})(SubjectType || (SubjectType = {}));
export var ComplianceStatus;
(function (ComplianceStatus) {
    ComplianceStatus["COMPLIANT"] = "compliant";
    ComplianceStatus["NON_COMPLIANT"] = "non_compliant";
    ComplianceStatus["PARTIAL"] = "partial";
    ComplianceStatus["UNKNOWN"] = "unknown";
})(ComplianceStatus || (ComplianceStatus = {}));
export var EthicalSeverity;
(function (EthicalSeverity) {
    EthicalSeverity["MINOR"] = "minor";
    EthicalSeverity["MODERATE"] = "moderate";
    EthicalSeverity["MAJOR"] = "major";
    EthicalSeverity["CRITICAL"] = "critical";
})(EthicalSeverity || (EthicalSeverity = {}));
export var LegalSeverity;
(function (LegalSeverity) {
    LegalSeverity["CIVIL"] = "civil";
    LegalSeverity["CRIMINAL"] = "criminal";
    LegalSeverity["REGULATORY"] = "regulatory";
})(LegalSeverity || (LegalSeverity = {}));
export class GovernanceError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'GovernanceError';
    }
}
export class PolicyViolationError extends GovernanceError {
    constructor(policyId, ruleId, details) {
        super(`Policy violation: ${policyId} - ${ruleId}`, 'POLICY_VIOLATION', details);
        this.name = 'PolicyViolationError';
    }
}
export class ComplianceError extends GovernanceError {
    constructor(message, jurisdiction, details) {
        super(message, 'COMPLIANCE_ERROR', { jurisdiction, ...details });
        this.name = 'ComplianceError';
    }
}
//# sourceMappingURL=index.js.map