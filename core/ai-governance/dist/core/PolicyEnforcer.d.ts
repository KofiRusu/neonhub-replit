import { EventEmitter } from 'events';
import { AuditSubject } from '../types/index.js';
export declare class PolicyEnforcer extends EventEmitter {
    private policyEngine;
    private ethicalFramework;
    private legalComplianceManager;
    private auditLogger;
    constructor(policyEngine?: any, ethicalFramework?: any, legalComplianceManager?: any, auditLogger?: any);
    /**
     * Enforce policies on a subject/action
     */
    enforce(subject: AuditSubject, action: string, context?: Record<string, any>): Promise<{
        allowed: boolean;
        reason?: string;
        recommendations?: string[];
    }>;
    /**
     * Execute enforcement actions for denied requests
     */
    private executeEnforcementActions;
    /**
     * Determine appropriate enforcement action
     */
    private determineEnforcementAction;
    /**
     * Execute block action
     */
    private executeBlockAction;
    /**
     * Execute quarantine action
     */
    private executeQuarantineAction;
    /**
     * Execute alert action
     */
    private executeAlertAction;
    /**
     * Execute log action
     */
    private executeLogAction;
    /**
     * Check if enforcement should be bypassed
     */
    shouldBypassEnforcement(subject: AuditSubject, context?: Record<string, any>): boolean;
    /**
     * Get enforcement statistics
     */
    getEnforcementStats(): {
        totalEnforcements: number;
        blocks: number;
        quarantines: number;
        alerts: number;
        logs: number;
    };
    /**
     * Set dependencies (for dependency injection)
     */
    setDependencies(dependencies: {
        policyEngine?: any;
        ethicalFramework?: any;
        legalComplianceManager?: any;
        auditLogger?: any;
    }): void;
}
//# sourceMappingURL=PolicyEnforcer.d.ts.map