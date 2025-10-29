import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, PolicyViolationError, GovernanceError, ConditionType, ConditionOperator, ActionType, SubjectType } from '../types/index.js';
export class PolicyEngine extends EventEmitter {
    constructor(config, auditLogger) {
        super();
        this.policies = new Map();
        this.config = config;
        this.auditLogger = auditLogger;
    }
    /**
     * Load a policy into the engine
     */
    async loadPolicy(policy) {
        try {
            // Validate policy structure
            this.validatePolicy(policy);
            // Check for conflicts with existing policies
            this.checkPolicyConflicts(policy);
            // Store the policy
            this.policies.set(policy.id, policy);
            // Emit policy loaded event
            this.emit('policyLoaded', { policyId: policy.id, policy });
            // Log audit entry
            if (this.auditLogger) {
                await this.auditLogger.log({
                    id: randomUUID(),
                    timestamp: new Date(),
                    policyId: policy.id,
                    action: AuditAction.POLICY_UPDATE,
                    subject: {
                        type: SubjectType.SYSTEM,
                        id: 'policy-engine',
                        attributes: { action: 'load_policy' }
                    },
                    result: AuditResult.ALLOWED,
                    details: { policyName: policy.name, version: policy.version }
                });
            }
        }
        catch (error) {
            throw new GovernanceError(`Failed to load policy ${policy.id}: ${error.message}`, 'POLICY_LOAD_ERROR', { policyId: policy.id });
        }
    }
    /**
     * Evaluate a subject against all applicable policies
     */
    async evaluate(subject, context) {
        const violations = [];
        const appliedPolicies = [];
        let allowed = true;
        try {
            // Get applicable policies based on jurisdiction and category
            const applicablePolicies = this.getApplicablePolicies(subject);
            for (const policy of applicablePolicies) {
                appliedPolicies.push(policy.id);
                const policyResult = await this.evaluatePolicy(policy, subject, context);
                if (!policyResult.allowed) {
                    allowed = false;
                    violations.push(...policyResult.violations);
                }
            }
            // Log evaluation result
            if (this.auditLogger) {
                await this.auditLogger.log({
                    id: randomUUID(),
                    timestamp: new Date(),
                    action: AuditAction.POLICY_EVALUATION,
                    subject,
                    result: allowed ? AuditResult.ALLOWED : AuditResult.DENIED,
                    details: {
                        appliedPolicies,
                        violationCount: violations.length,
                        context
                    }
                });
            }
            return { allowed, violations, appliedPolicies };
        }
        catch (error) {
            // Log evaluation error
            if (this.auditLogger) {
                await this.auditLogger.log({
                    id: randomUUID(),
                    timestamp: new Date(),
                    action: AuditAction.POLICY_EVALUATION,
                    subject,
                    result: AuditResult.ERROR,
                    details: { error: error.message, context }
                });
            }
            throw error;
        }
    }
    /**
     * Update an existing policy
     */
    async updatePolicy(policyId, updates) {
        const existingPolicy = this.policies.get(policyId);
        if (!existingPolicy) {
            throw new GovernanceError(`Policy ${policyId} not found`, 'POLICY_NOT_FOUND');
        }
        const updatedPolicy = {
            ...existingPolicy,
            ...updates,
            updatedAt: new Date()
        };
        // Validate updated policy
        this.validatePolicy(updatedPolicy);
        // Check for conflicts
        this.checkPolicyConflicts(updatedPolicy, policyId);
        // Update policy
        this.policies.set(policyId, updatedPolicy);
        // Emit update event
        this.emit('policyUpdated', { policyId, policy: updatedPolicy });
        // Log audit entry
        if (this.auditLogger) {
            await this.auditLogger.log({
                id: randomUUID(),
                timestamp: new Date(),
                policyId,
                action: AuditAction.POLICY_UPDATE,
                subject: {
                    type: SubjectType.SYSTEM,
                    id: 'policy-engine',
                    attributes: { action: 'update_policy' }
                },
                result: AuditResult.ALLOWED,
                details: { updates }
            });
        }
    }
    /**
     * Remove a policy from the engine
     */
    async removePolicy(policyId) {
        if (!this.policies.has(policyId)) {
            throw new GovernanceError(`Policy ${policyId} not found`, 'POLICY_NOT_FOUND');
        }
        this.policies.delete(policyId);
        // Emit removal event
        this.emit('policyRemoved', { policyId });
        // Log audit entry
        if (this.auditLogger) {
            await this.auditLogger.log({
                id: randomUUID(),
                timestamp: new Date(),
                policyId,
                action: AuditAction.POLICY_UPDATE,
                subject: {
                    type: SubjectType.SYSTEM,
                    id: 'policy-engine',
                    attributes: { action: 'remove_policy' }
                },
                result: AuditResult.ALLOWED,
                details: {}
            });
        }
    }
    /**
     * Get all policies
     */
    getPolicies() {
        return Array.from(this.policies.values());
    }
    /**
     * Get a specific policy by ID
     */
    getPolicy(policyId) {
        return this.policies.get(policyId);
    }
    /**
     * Get policies applicable to a subject
     */
    getApplicablePolicies(subject) {
        return Array.from(this.policies.values()).filter(policy => {
            // Check if policy is active
            if (policy.status !== 'active')
                return false;
            // Check jurisdiction overlap
            const jurisdictionOverlap = policy.jurisdiction.some(jur => this.config.jurisdictions.includes(jur));
            if (!jurisdictionOverlap)
                return false;
            // Check subject type compatibility
            // This could be extended based on policy categories
            return true;
        });
    }
    /**
     * Evaluate a single policy against a subject
     */
    async evaluatePolicy(policy, subject, context) {
        const violations = [];
        let policyAllowed = true;
        for (const rule of policy.rules) {
            if (!rule.enabled)
                continue;
            try {
                const ruleResult = this.evaluateRule(rule, subject, context);
                if (!ruleResult.allowed) {
                    policyAllowed = false;
                    violations.push(new PolicyViolationError(policy.id, rule.id, {
                        policyName: policy.name,
                        ruleName: rule.name,
                        subject,
                        context
                    }));
                    // Execute rule action
                    await this.executeRuleAction(rule, subject, context);
                    // Log rule trigger
                    if (this.auditLogger) {
                        await this.auditLogger.log({
                            id: randomUUID(),
                            timestamp: new Date(),
                            policyId: policy.id,
                            ruleId: rule.id,
                            action: AuditAction.RULE_TRIGGERED,
                            subject,
                            result: AuditResult.DENIED,
                            details: { ruleName: rule.name, context }
                        });
                    }
                }
            }
            catch (error) {
                // Log rule evaluation error
                if (this.auditLogger) {
                    await this.auditLogger.log({
                        id: randomUUID(),
                        timestamp: new Date(),
                        policyId: policy.id,
                        ruleId: rule.id,
                        action: AuditAction.RULE_TRIGGERED,
                        subject,
                        result: AuditResult.ERROR,
                        details: { error: error.message, context }
                    });
                }
                throw error;
            }
        }
        return { allowed: policyAllowed, violations };
    }
    /**
     * Evaluate a single rule
     */
    evaluateRule(rule, subject, context) {
        const { condition } = rule;
        // Evaluate condition based on type
        switch (condition.type) {
            case ConditionType.ATTRIBUTE:
                return this.evaluateAttributeCondition(condition, subject, context);
            case ConditionType.METRIC:
                return this.evaluateMetricCondition(condition, subject, context);
            case ConditionType.TIME:
                return this.evaluateTimeCondition(condition, context);
            case ConditionType.LOCATION:
                return this.evaluateLocationCondition(condition, subject, context);
            case ConditionType.USER:
                return this.evaluateUserCondition(condition, subject, context);
            case ConditionType.SYSTEM:
                return this.evaluateSystemCondition(condition, context);
            default:
                return { allowed: true }; // Allow by default for unknown condition types
        }
    }
    /**
     * Execute rule action
     */
    async executeRuleAction(rule, subject, context) {
        const { action } = rule;
        switch (action.type) {
            case ActionType.LOG:
                this.emit('ruleAction', {
                    type: 'log',
                    ruleId: rule.id,
                    subject,
                    severity: action.severity,
                    details: action.parameters
                });
                break;
            case ActionType.ALERT:
                this.emit('ruleAction', {
                    type: 'alert',
                    ruleId: rule.id,
                    subject,
                    severity: action.severity,
                    message: action.parameters.message || 'Policy violation detected'
                });
                break;
            case ActionType.DENY:
                // Action handled by caller
                break;
            case ActionType.QUARANTINE:
                this.emit('ruleAction', {
                    type: 'quarantine',
                    ruleId: rule.id,
                    subject,
                    severity: action.severity,
                    duration: action.parameters.duration
                });
                break;
            case ActionType.THROTTLE:
                this.emit('ruleAction', {
                    type: 'throttle',
                    ruleId: rule.id,
                    subject,
                    severity: action.severity,
                    rateLimit: action.parameters.rateLimit
                });
                break;
            case ActionType.NOTIFY:
                this.emit('ruleAction', {
                    type: 'notify',
                    ruleId: rule.id,
                    subject,
                    severity: action.severity,
                    recipients: action.parameters.recipients,
                    message: action.parameters.message
                });
                break;
            default:
                // Unknown action type - log warning
                console.warn(`Unknown action type: ${action.type}`);
        }
    }
    /**
     * Evaluate attribute-based conditions
     */
    evaluateAttributeCondition(condition, subject, context) {
        const attributeValue = subject.attributes[condition.attribute] ||
            context?.[condition.attribute];
        return this.evaluateOperator(condition.operator, attributeValue, condition.value);
    }
    /**
     * Evaluate metric-based conditions
     */
    evaluateMetricCondition(condition, subject, context) {
        // This would integrate with monitoring systems
        // For now, return true
        return { allowed: true };
    }
    /**
     * Evaluate time-based conditions
     */
    evaluateTimeCondition(condition, context) {
        const now = new Date();
        const conditionTime = new Date(condition.value);
        return this.evaluateOperator(condition.operator, now.getTime(), conditionTime.getTime());
    }
    /**
     * Evaluate location-based conditions
     */
    evaluateLocationCondition(condition, subject, context) {
        const location = subject.attributes.location || context?.location;
        return this.evaluateOperator(condition.operator, location, condition.value);
    }
    /**
     * Evaluate user-based conditions
     */
    evaluateUserCondition(condition, subject, context) {
        if (subject.type !== SubjectType.USER)
            return { allowed: true };
        const userAttribute = subject.attributes[condition.attribute];
        return this.evaluateOperator(condition.operator, userAttribute, condition.value);
    }
    /**
     * Evaluate system-based conditions
     */
    evaluateSystemCondition(condition, context) {
        const systemValue = context?.[condition.attribute];
        return this.evaluateOperator(condition.operator, systemValue, condition.value);
    }
    /**
     * Evaluate comparison operators
     */
    evaluateOperator(operator, left, right) {
        switch (operator) {
            case ConditionOperator.EQUALS:
                return { allowed: left === right };
            case ConditionOperator.NOT_EQUALS:
                return { allowed: left !== right };
            case ConditionOperator.GREATER_THAN:
                return { allowed: left > right };
            case ConditionOperator.LESS_THAN:
                return { allowed: left < right };
            case ConditionOperator.CONTAINS:
                return { allowed: String(left).includes(String(right)) };
            case ConditionOperator.NOT_CONTAINS:
                return { allowed: !String(left).includes(String(right)) };
            case ConditionOperator.IN:
                return { allowed: Array.isArray(right) ? right.includes(left) : false };
            case ConditionOperator.NOT_IN:
                return { allowed: Array.isArray(right) ? !right.includes(left) : true };
            case ConditionOperator.REGEX:
                try {
                    const regex = new RegExp(right);
                    return { allowed: regex.test(String(left)) };
                }
                catch {
                    return { allowed: false };
                }
            default:
                return { allowed: true };
        }
    }
    /**
     * Validate policy structure
     */
    validatePolicy(policy) {
        if (!policy.id || !policy.name || !policy.rules) {
            throw new GovernanceError('Invalid policy structure', 'INVALID_POLICY');
        }
        // Validate rules
        for (const rule of policy.rules) {
            if (!rule.id || !rule.condition || !rule.action) {
                throw new GovernanceError(`Invalid rule structure in policy ${policy.id}`, 'INVALID_RULE');
            }
        }
    }
    /**
     * Check for policy conflicts
     */
    checkPolicyConflicts(policy, excludeId) {
        for (const [id, existingPolicy] of this.policies) {
            if (excludeId && id === excludeId)
                continue;
            // Check for conflicting jurisdictions and categories
            const jurisdictionOverlap = policy.jurisdiction.some(jur => existingPolicy.jurisdiction.includes(jur));
            if (jurisdictionOverlap && existingPolicy.category === policy.category) {
                console.warn(`Potential policy conflict between ${policy.id} and ${id}`);
            }
        }
    }
}
//# sourceMappingURL=PolicyEngine.js.map