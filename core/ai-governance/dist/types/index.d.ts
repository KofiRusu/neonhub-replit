export interface Policy {
    id: string;
    name: string;
    description: string;
    version: string;
    jurisdiction: string[];
    category: PolicyCategory;
    rules: PolicyRule[];
    metadata: PolicyMetadata;
    createdAt: Date;
    updatedAt: Date;
    status: PolicyStatus;
}
export interface PolicyRule {
    id: string;
    name: string;
    description: string;
    condition: RuleCondition;
    action: RuleAction;
    priority: number;
    enabled: boolean;
}
export interface RuleCondition {
    type: ConditionType;
    operator: ConditionOperator;
    value: any;
    context?: Record<string, any>;
}
export interface RuleAction {
    type: ActionType;
    parameters: Record<string, any>;
    severity: ActionSeverity;
}
export interface PolicyMetadata {
    author: string;
    tags: string[];
    complianceFrameworks: string[];
    riskLevel: RiskLevel;
    reviewCycle: number;
    expirationDate?: Date;
}
export interface AuditEntry {
    id: string;
    timestamp: Date;
    policyId: string;
    ruleId?: string;
    action: AuditAction;
    subject: AuditSubject;
    result: AuditResult;
    details: Record<string, any>;
    userId?: string;
    sessionId?: string;
}
export interface AuditSubject {
    type: SubjectType;
    id: string;
    attributes: Record<string, any>;
}
export interface ComplianceReport {
    id: string;
    timestamp: Date;
    period: {
        start: Date;
        end: Date;
    };
    jurisdiction: string;
    policies: CompliancePolicyResult[];
    overallCompliance: number;
    violations: ComplianceViolation[];
    recommendations: string[];
}
export interface CompliancePolicyResult {
    policyId: string;
    policyName: string;
    compliance: number;
    violations: number;
    lastChecked: Date;
}
export interface ComplianceViolation {
    id: string;
    policyId: string;
    ruleId: string;
    timestamp: Date;
    severity: ActionSeverity;
    description: string;
    subject: AuditSubject;
    remediation?: string;
}
export interface EthicalAssessment {
    id: string;
    timestamp: Date;
    subject: AuditSubject;
    principles: EthicalPrinciple[];
    score: number;
    concerns: EthicalConcern[];
    recommendations: string[];
}
export interface EthicalPrinciple {
    name: string;
    description: string;
    weight: number;
    score: number;
    evidence: string[];
}
export interface EthicalConcern {
    principle: string;
    severity: EthicalSeverity;
    description: string;
    mitigation?: string;
}
export interface LegalComplianceCheck {
    id: string;
    timestamp: Date;
    jurisdiction: string;
    framework: string;
    requirements: LegalRequirement[];
    compliance: number;
    violations: LegalViolation[];
}
export interface LegalRequirement {
    id: string;
    description: string;
    category: string;
    mandatory: boolean;
    status: ComplianceStatus;
}
export interface LegalViolation {
    requirementId: string;
    description: string;
    severity: LegalSeverity;
    deadline?: Date;
    remediation: string;
}
export declare enum PolicyCategory {
    ETHICAL = "ethical",
    LEGAL = "legal",
    SECURITY = "security",
    PRIVACY = "privacy",
    PERFORMANCE = "performance",
    COMPLIANCE = "compliance"
}
export declare enum PolicyStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    DEPRECATED = "deprecated",
    ARCHIVED = "archived"
}
export declare enum ConditionType {
    ATTRIBUTE = "attribute",
    METRIC = "metric",
    TIME = "time",
    LOCATION = "location",
    USER = "user",
    SYSTEM = "system"
}
export declare enum ConditionOperator {
    EQUALS = "equals",
    NOT_EQUALS = "not_equals",
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than",
    CONTAINS = "contains",
    NOT_CONTAINS = "not_contains",
    REGEX = "regex",
    IN = "in",
    NOT_IN = "not_in"
}
export declare enum ActionType {
    ALLOW = "allow",
    DENY = "deny",
    LOG = "log",
    ALERT = "alert",
    QUARANTINE = "quarantine",
    THROTTLE = "throttle",
    NOTIFY = "notify"
}
export declare enum ActionSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum RiskLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum AuditAction {
    POLICY_EVALUATION = "policy_evaluation",
    RULE_TRIGGERED = "rule_triggered",
    COMPLIANCE_CHECK = "compliance_check",
    VIOLATION_DETECTED = "violation_detected",
    POLICY_UPDATE = "policy_update",
    SYSTEM_ACCESS = "system_access"
}
export declare enum AuditResult {
    ALLOWED = "allowed",
    DENIED = "denied",
    WARNING = "warning",
    ERROR = "error"
}
export declare enum SubjectType {
    USER = "user",
    SYSTEM = "system",
    MODEL = "model",
    DATASET = "dataset",
    REQUEST = "request",
    RESPONSE = "response"
}
export declare enum ComplianceStatus {
    COMPLIANT = "compliant",
    NON_COMPLIANT = "non_compliant",
    PARTIAL = "partial",
    UNKNOWN = "unknown"
}
export declare enum EthicalSeverity {
    MINOR = "minor",
    MODERATE = "moderate",
    MAJOR = "major",
    CRITICAL = "critical"
}
export declare enum LegalSeverity {
    CIVIL = "civil",
    CRIMINAL = "criminal",
    REGULATORY = "regulatory"
}
export interface PolicyEngineConfig {
    enableDynamicUpdates: boolean;
    auditLevel: 'basic' | 'detailed' | 'comprehensive';
    complianceCheckInterval: number;
    maxAuditRetention: number;
    jurisdictions: string[];
}
export interface EthicalFrameworkConfig {
    principles: EthicalPrinciple[];
    assessmentThreshold: number;
    reviewCycle: number;
    escalationThreshold: EthicalSeverity;
}
export interface LegalComplianceConfig {
    jurisdictions: string[];
    frameworks: string[];
    updateFrequency: number;
    alertThreshold: LegalSeverity;
}
export declare class GovernanceError extends Error {
    code: string;
    details?: Record<string, any> | undefined;
    constructor(message: string, code: string, details?: Record<string, any> | undefined);
}
export declare class PolicyViolationError extends GovernanceError {
    constructor(policyId: string, ruleId: string, details?: Record<string, any>);
}
export declare class ComplianceError extends GovernanceError {
    constructor(message: string, jurisdiction: string, details?: Record<string, any>);
}
//# sourceMappingURL=index.d.ts.map