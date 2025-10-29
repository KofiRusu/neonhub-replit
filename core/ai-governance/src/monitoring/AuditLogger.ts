import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import {
  AuditEntry,
  AuditAction,
  AuditResult,
  AuditSubject,
  SubjectType,
  GovernanceError
} from '../types/index.js';

export class AuditLogger extends EventEmitter {
  private logger: SimpleLogger;
  private auditEntries: AuditEntry[] = [];
  private maxEntries: number;
  private retentionDays: number;

  constructor(options: {
    maxEntries?: number;
    retentionDays?: number;
    logLevel?: string;
    logFile?: string;
  } = {}) {
    super();

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
  async log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> {
    try {
      const auditEntry: AuditEntry = {
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
    } catch (error) {
      // Fallback logging if audit logging fails
      console.error('Failed to log audit entry:', error);
      throw new GovernanceError(
        `Audit logging failed: ${(error as Error).message}`,
        'AUDIT_LOG_ERROR'
      );
    }
  }

  /**
   * Log policy evaluation
   */
  async logPolicyEvaluation(
    policyId: string,
    subject: AuditSubject,
    result: AuditResult,
    details?: Record<string, any>
  ): Promise<AuditEntry> {
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
  async logRuleTrigger(
    policyId: string,
    ruleId: string,
    subject: AuditSubject,
    result: AuditResult,
    details?: Record<string, any>
  ): Promise<AuditEntry> {
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
  async logComplianceCheck(
    subject: AuditSubject,
    jurisdiction: string,
    result: AuditResult,
    details?: Record<string, any>
  ): Promise<AuditEntry> {
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
  async logViolation(
    policyId: string,
    ruleId: string,
    subject: AuditSubject,
    severity: string,
    details?: Record<string, any>
  ): Promise<AuditEntry> {
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
  queryAuditEntries(filters: {
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
  } = {}): AuditEntry[] {
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
      results = results.filter(entry => entry.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      results = results.filter(entry => entry.timestamp <= filters.endDate!);
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
  getAuditStats(timeRange?: { start: Date; end: Date }): {
    totalEntries: number;
    entriesByAction: Record<AuditAction, number>;
    entriesByResult: Record<AuditResult, number>;
    violationsCount: number;
    uniqueSubjects: number;
  } {
    let entries = this.auditEntries;

    if (timeRange) {
      entries = entries.filter(entry =>
        entry.timestamp >= timeRange.start && entry.timestamp <= timeRange.end
      );
    }

    const stats = {
      totalEntries: entries.length,
      entriesByAction: {} as Record<AuditAction, number>,
      entriesByResult: {} as Record<AuditResult, number>,
      violationsCount: 0,
      uniqueSubjects: new Set<string>().size
    };

    const uniqueSubjects = new Set<string>();

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
  exportAuditEntries(filters?: {
    startDate?: Date;
    endDate?: Date;
  }): string {
    const entries = this.queryAuditEntries(filters);
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Clear old audit entries based on retention policy
   */
  private cleanupOldEntries(): void {
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
  private startCleanupInterval(): void {
    // Run cleanup daily
    setInterval(() => {
      this.cleanupOldEntries();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Get current audit entries count
   */
  getAuditEntriesCount(): number {
    return this.auditEntries.length;
  }

  /**
   * Get recent audit logs
   */
  getRecentLogs(limit: number = 100): AuditEntry[] {
    return this.queryAuditEntries({ limit });
  }

  /**
   * Flush all audit entries (for testing)
   */
  clearAuditEntries(): void {
    this.auditEntries = [];
  }

  /**
   * Close the logger
   */
  async close(): Promise<void> {
    await this.logger.close();
  }
}

type LogLevelName = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_ORDER: Record<LogLevelName, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

class SimpleLogger {
  private readonly minLevel: number;

  constructor(options: { level?: string } = {}) {
    const level = (options.level?.toLowerCase() as LogLevelName) || 'info';
    this.minLevel = LOG_LEVEL_ORDER[level] ?? LOG_LEVEL_ORDER.info;
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  on(_event: string, _listener: () => void): this {
    return this;
  }

  end(): void {
    // no-op for console logger
  }

  async close(): Promise<void> {
    return Promise.resolve();
  }

  private log(level: LogLevelName, message: string, meta?: Record<string, unknown>): void {
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
