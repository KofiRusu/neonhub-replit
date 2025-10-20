import { EventEmitter } from 'events';
import { AuditEntry, AuditAction, AuditResult, AuditSubject, SubjectType } from '../types/index.js';
export declare class AuditLogger extends EventEmitter {
    private logger;
    private auditEntries;
    private maxEntries;
    private retentionDays;
    constructor(options?: {
        maxEntries?: number;
        retentionDays?: number;
        logLevel?: string;
        logFile?: string;
    });
    /**
     * Log an audit entry
     */
    log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry>;
    /**
     * Log policy evaluation
     */
    logPolicyEvaluation(policyId: string, subject: AuditSubject, result: AuditResult, details?: Record<string, any>): Promise<AuditEntry>;
    /**
     * Log rule trigger
     */
    logRuleTrigger(policyId: string, ruleId: string, subject: AuditSubject, result: AuditResult, details?: Record<string, any>): Promise<AuditEntry>;
    /**
     * Log compliance check
     */
    logComplianceCheck(subject: AuditSubject, jurisdiction: string, result: AuditResult, details?: Record<string, any>): Promise<AuditEntry>;
    /**
     * Log violation detection
     */
    logViolation(policyId: string, ruleId: string, subject: AuditSubject, severity: string, details?: Record<string, any>): Promise<AuditEntry>;
    /**
     * Query audit entries with filters
     */
    queryAuditEntries(filters?: {
        subjectId?: string;
        subjectType?: SubjectType;
        action?: AuditAction;
        result?: AuditResult;
        policyId?: string;
        ruleId?: string;
        userId?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): AuditEntry[];
    /**
     * Get audit statistics
     */
    getAuditStats(timeRange?: {
        start: Date;
        end: Date;
    }): {
        totalEntries: number;
        entriesByAction: Record<AuditAction, number>;
        entriesByResult: Record<AuditResult, number>;
        violationsCount: number;
        uniqueSubjects: number;
    };
    /**
     * Export audit entries to JSON
     */
    exportAuditEntries(filters?: {
        startDate?: Date;
        endDate?: Date;
    }): string;
    /**
     * Clear old audit entries based on retention policy
     */
    private cleanupOldEntries;
    /**
     * Start periodic cleanup
     */
    private startCleanupInterval;
    /**
     * Get current audit entries count
     */
    getAuditEntriesCount(): number;
    /**
     * Get recent audit logs
     */
    getRecentLogs(limit?: number): AuditEntry[];
    /**
     * Flush all audit entries (for testing)
     */
    clearAuditEntries(): void;
    /**
     * Close the logger
     */
    close(): Promise<void>;
}
//# sourceMappingURL=AuditLogger.d.ts.map