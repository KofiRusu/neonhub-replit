import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { AuditAction, AuditResult, GovernanceError } from '../types/index.js';
export class AuditLogger extends EventEmitter {
    constructor(options = {}) {
        super();
        this.auditEntries = [];
        this.maxEntries = options.maxEntries || 10000;
        this.retentionDays = options.retentionDays || 90;
        this.logger = new SimpleLogger({
            level: options.logLevel || 'info'
        });
        // Start cleanup interval
        this.startCleanupInterval();
    }
    /**
     * Log an audit entry
     */
    async log(entry) {
        try {
            const auditEntry = {
                id: randomUUID(),
                timestamp: new Date(),
                ...entry
            };
            // Store in memory (for quick access)
            this.auditEntries.push(auditEntry);
            // Maintain max entries limit
            if (this.auditEntries.length > this.maxEntries) {
                this.auditEntries.shift(); // Remove oldest entry
            }
            // Log to Winston
            this.logger.info('Audit Entry', {
                auditId: auditEntry.id,
                action: auditEntry.action,
                subjectType: auditEntry.subject.type,
                subjectId: auditEntry.subject.id,
                result: auditEntry.result,
                details: auditEntry.details
            });
            // Emit audit event
            this.emit('auditEntry', auditEntry);
            return auditEntry;
        }
        catch (error) {
            // Fallback logging if audit logging fails
            console.error('Failed to log audit entry:', error);
            throw new GovernanceError(`Audit logging failed: ${error.message}`, 'AUDIT_LOG_ERROR');
        }
    }
    /**
     * Log policy evaluation
     */
    async logPolicyEvaluation(policyId, subject, result, details) {
        return this.log({
            action: AuditAction.POLICY_EVALUATION,
            subject,
            result,
            policyId,
            details: details || {}
        });
    }
    /**
     * Log rule trigger
     */
    async logRuleTrigger(policyId, ruleId, subject, result, details) {
        return this.log({
            action: AuditAction.RULE_TRIGGERED,
            subject,
            result,
            policyId,
            ruleId,
            details: details || {}
        });
    }
    /**
     * Log compliance check
     */
    async logComplianceCheck(subject, jurisdiction, result, details) {
        return this.log({
            action: AuditAction.COMPLIANCE_CHECK,
            subject,
            result,
            policyId: '',
            details: { jurisdiction, ...details }
        });
    }
    /**
     * Log violation detection
     */
    async logViolation(policyId, ruleId, subject, severity, details) {
        return this.log({
            action: AuditAction.VIOLATION_DETECTED,
            subject,
            result: AuditResult.DENIED,
            policyId,
            ruleId,
            details: { severity, ...details }
        });
    }
    /**
     * Query audit entries with filters
     */
    queryAuditEntries(filters = {}) {
        let results = [...this.auditEntries];
        // Apply filters
        if (filters.subjectId) {
            results = results.filter(entry => entry.subject.id === filters.subjectId);
        }
        if (filters.subjectType) {
            results = results.filter(entry => entry.subject.type === filters.subjectType);
        }
        if (filters.action) {
            results = results.filter(entry => entry.action === filters.action);
        }
        if (filters.result) {
            results = results.filter(entry => entry.result === filters.result);
        }
        if (filters.policyId) {
            results = results.filter(entry => entry.policyId === filters.policyId);
        }
        if (filters.ruleId) {
            results = results.filter(entry => entry.ruleId === filters.ruleId);
        }
        if (filters.userId) {
            results = results.filter(entry => entry.userId === filters.userId);
        }
        if (filters.startDate) {
            results = results.filter(entry => entry.timestamp >= filters.startDate);
        }
        if (filters.endDate) {
            results = results.filter(entry => entry.timestamp <= filters.endDate);
        }
        // Sort by timestamp (newest first)
        results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        // Apply limit
        if (filters.limit) {
            results = results.slice(0, filters.limit);
        }
        return results;
    }
    /**
     * Get audit statistics
     */
    getAuditStats(timeRange) {
        let entries = this.auditEntries;
        if (timeRange) {
            entries = entries.filter(entry => entry.timestamp >= timeRange.start && entry.timestamp <= timeRange.end);
        }
        const stats = {
            totalEntries: entries.length,
            entriesByAction: {},
            entriesByResult: {},
            violationsCount: 0,
            uniqueSubjects: new Set().size
        };
        const uniqueSubjects = new Set();
        for (const entry of entries) {
            // Count by action
            stats.entriesByAction[entry.action] = (stats.entriesByAction[entry.action] || 0) + 1;
            // Count by result
            stats.entriesByResult[entry.result] = (stats.entriesByResult[entry.result] || 0) + 1;
            // Count violations
            if (entry.action === AuditAction.VIOLATION_DETECTED) {
                stats.violationsCount++;
            }
            // Track unique subjects
            uniqueSubjects.add(`${entry.subject.type}:${entry.subject.id}`);
        }
        stats.uniqueSubjects = uniqueSubjects.size;
        return stats;
    }
    /**
     * Export audit entries to JSON
     */
    exportAuditEntries(filters) {
        const entries = this.queryAuditEntries(filters);
        return JSON.stringify(entries, null, 2);
    }
    /**
     * Clear old audit entries based on retention policy
     */
    cleanupOldEntries() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
        const initialLength = this.auditEntries.length;
        this.auditEntries = this.auditEntries.filter(entry => entry.timestamp >= cutoffDate);
        const removedCount = initialLength - this.auditEntries.length;
        if (removedCount > 0) {
            this.logger.info(`Cleaned up ${removedCount} old audit entries`);
        }
    }
    /**
     * Start periodic cleanup
     */
    startCleanupInterval() {
        // Run cleanup daily
        setInterval(() => {
            this.cleanupOldEntries();
        }, 24 * 60 * 60 * 1000); // 24 hours
    }
    /**
     * Get current audit entries count
     */
    getAuditEntriesCount() {
        return this.auditEntries.length;
    }
    /**
     * Get recent audit logs
     */
    getRecentLogs(limit = 100) {
        return this.queryAuditEntries({ limit });
    }
    /**
     * Flush all audit entries (for testing)
     */
    clearAuditEntries() {
        this.auditEntries = [];
    }
    /**
     * Close the logger
     */
    async close() {
        await this.logger.close();
    }
}
const LOG_LEVEL_ORDER = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40
};
class SimpleLogger {
    constructor(options = {}) {
        const level = options.level?.toLowerCase() || 'info';
        this.minLevel = LOG_LEVEL_ORDER[level] ?? LOG_LEVEL_ORDER.info;
    }
    info(message, meta) {
        this.log('info', message, meta);
    }
    warn(message, meta) {
        this.log('warn', message, meta);
    }
    error(message, meta) {
        this.log('error', message, meta);
    }
    debug(message, meta) {
        this.log('debug', message, meta);
    }
    on(_event, _listener) {
        return this;
    }
    end() {
        // no-op for console logger
    }
    async close() {
        return Promise.resolve();
    }
    log(level, message, meta) {
        if (LOG_LEVEL_ORDER[level] < this.minLevel) {
            return;
        }
        const payload = {
            level,
            message,
            timestamp: new Date().toISOString(),
            ...(meta ? { meta } : {})
        };
        switch (level) {
            case 'error':
                console.error(payload);
                break;
            case 'warn':
                console.warn(payload);
                break;
            case 'debug':
                console.debug(payload);
                break;
            default:
                console.info(payload);
        }
    }
}
//# sourceMappingURL=AuditLogger.js.map