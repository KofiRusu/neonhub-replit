import { EventEmitter } from 'events';
import { Policy, PolicyEngineConfig, AuditSubject, PolicyViolationError } from '../types/index.js';
export declare class PolicyEngine extends EventEmitter {
    private policies;
    private config;
    private auditLogger;
    constructor(config: PolicyEngineConfig, auditLogger?: any);
    /**
     * Load a policy into the engine
     */
    loadPolicy(policy: Policy): Promise<void>;
    /**
     * Evaluate a subject against all applicable policies
     */
    evaluate(subject: AuditSubject, context?: Record<string, any>): Promise<{
        allowed: boolean;
        violations: PolicyViolationError[];
        appliedPolicies: string[];
    }>;
    /**
     * Update an existing policy
     */
    updatePolicy(policyId: string, updates: Partial<Policy>): Promise<void>;
    /**
     * Remove a policy from the engine
     */
    removePolicy(policyId: string): Promise<void>;
    /**
     * Get all policies
     */
    getPolicies(): Policy[];
    /**
     * Get a specific policy by ID
     */
    getPolicy(policyId: string): Policy | undefined;
    /**
     * Get policies applicable to a subject
     */
    private getApplicablePolicies;
    /**
     * Evaluate a single policy against a subject
     */
    private evaluatePolicy;
    /**
     * Evaluate a single rule
     */
    private evaluateRule;
    /**
     * Execute rule action
     */
    private executeRuleAction;
    /**
     * Evaluate attribute-based conditions
     */
    private evaluateAttributeCondition;
    /**
     * Evaluate metric-based conditions
     */
    private evaluateMetricCondition;
    /**
     * Evaluate time-based conditions
     */
    private evaluateTimeCondition;
    /**
     * Evaluate location-based conditions
     */
    private evaluateLocationCondition;
    /**
     * Evaluate user-based conditions
     */
    private evaluateUserCondition;
    /**
     * Evaluate system-based conditions
     */
    private evaluateSystemCondition;
    /**
     * Evaluate comparison operators
     */
    private evaluateOperator;
    /**
     * Validate policy structure
     */
    private validatePolicy;
    /**
     * Check for policy conflicts
     */
    private checkPolicyConflicts;
}
//# sourceMappingURL=PolicyEngine.d.ts.map