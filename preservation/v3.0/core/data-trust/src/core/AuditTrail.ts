import { createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as winston from 'winston';
import {
  AuditEvent,
  AuditTrailInterface,
  AuditQuery,
  AuditLevel,
  AuditCategory,
  AuditError
} from '../types/index.js';

export class AuditTrail implements AuditTrailInterface {
  private events: Map<string, AuditEvent> = new Map();
  private logger: winston.Logger;
  private logFilePath: string;
  private retentionDays: number;

  constructor(options: {
    logLevel?: AuditLevel;
    logFilePath?: string;
    retentionDays?: number;
    format?: 'json' | 'simple';
  } = {}) {
    this.retentionDays = options.retentionDays || 90;
    this.logFilePath = options.logFilePath || './logs/audit.log';

    // Ensure log directory exists
    const logDir = this.logFilePath.substring(0, this.logFilePath.lastIndexOf('/'));
    fs.mkdir(logDir, { recursive: true }).catch(() => {}); // Ignore errors

    // Initialize Winston logger
    const logFormat = options.format === 'json'
      ? winston.format.json()
      : winston.format.simple();

    this.logger = winston.createLogger({
      level: options.logLevel || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        logFormat
      ),
      transports: [
        new winston.transports.File({
          filename: this.logFilePath,
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            logFormat
          )
        })
      ]
    });
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string> {
    try {
      const eventId = uuidv4();
      const fullEvent: AuditEvent = {
        id: eventId,
        timestamp: new Date(),
        ...event
      };

      // Store in memory
      this.events.set(eventId, fullEvent);

      // Log to Winston
      this.logger.log(event.level, event.action, {
        eventId,
        category: event.category,
        actor: event.actor,
        resource: event.resource,
        details: event.details,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        sessionId: event.sessionId,
        blockchainTx: event.blockchainTx
      });

      return eventId;
    } catch (error) {
      throw new AuditError(
        'Failed to log audit event',
        { originalError: error, event }
      );
    }
  }

  /**
   * Query audit events
   */
  async query(query: AuditQuery): Promise<AuditEvent[]> {
    try {
      let events = Array.from(this.events.values());

      // Apply filters
      if (query.startDate) {
        events = events.filter(e => e.timestamp >= query.startDate!);
      }

      if (query.endDate) {
        events = events.filter(e => e.timestamp <= query.endDate!);
      }

      if (query.level) {
        events = events.filter(e => e.level === query.level);
      }

      if (query.category) {
        events = events.filter(e => e.category === query.category);
      }

      if (query.actor) {
        events = events.filter(e => e.actor === query.actor);
      }

      if (query.resource) {
        events = events.filter(e => e.resource === query.resource);
      }

      // Sort by timestamp (newest first)
      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      if (query.limit && query.limit > 0) {
        const offset = query.offset || 0;
        events = events.slice(offset, offset + query.limit);
      }

      return events;
    } catch (error) {
      throw new AuditError(
        'Failed to query audit events',
        { originalError: error, query }
      );
    }
  }

  /**
   * Get a specific audit event
   */
  async getEvent(eventId: string): Promise<AuditEvent> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new AuditError(`Audit event not found: ${eventId}`);
    }
    return event;
  }

  /**
   * Export audit log to file
   */
  async exportAuditLog(query: AuditQuery, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const events = await this.query(query);

      if (format === 'csv') {
        const headers = [
          'id', 'timestamp', 'level', 'category', 'actor', 'action',
          'resource', 'details', 'ipAddress', 'userAgent', 'sessionId', 'blockchainTx'
        ];

        const rows = events.map(event => [
          event.id,
          event.timestamp.toISOString(),
          event.level,
          event.category,
          event.actor,
          event.action,
          event.resource,
          JSON.stringify(event.details),
          event.ipAddress || '',
          event.userAgent || '',
          event.sessionId || '',
          event.blockchainTx || ''
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
      } else {
        return JSON.stringify(events, null, 2);
      }
    } catch (error) {
      throw new AuditError(
        'Failed to export audit log',
        { originalError: error, query, format }
      );
    }
  }

  /**
   * Clean up old audit events
   */
  async cleanup(retentionDays: number = this.retentionDays): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      let deletedCount = 0;
      for (const [eventId, event] of this.events) {
        if (event.timestamp < cutoffDate) {
          this.events.delete(eventId);
          deletedCount++;
        }
      }

      // Also clean up log files older than retention period
      await this.cleanupLogFiles(retentionDays);

      return deletedCount;
    } catch (error) {
      throw new AuditError(
        'Failed to cleanup audit events',
        { originalError: error, retentionDays }
      );
    }
  }

  /**
   * Get audit statistics
   */
  getAuditStats(): {
    totalEvents: number;
    eventsByLevel: Record<AuditLevel, number>;
    eventsByCategory: Record<AuditCategory, number>;
    oldestEvent?: Date;
    newestEvent?: Date;
  } {
    const events = Array.from(this.events.values());
    const eventsByLevel: Record<AuditLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      critical: 0
    };

    const eventsByCategory: Record<AuditCategory, number> = {
      authentication: 0,
      authorization: 0,
      data_access: 0,
      data_modification: 0,
      integrity_check: 0,
      provenance: 0,
      blockchain: 0,
      system: 0
    };

    events.forEach(event => {
      eventsByLevel[event.level]++;
      eventsByCategory[event.category]++;
    });

    const timestamps = events.map(e => e.timestamp.getTime());
    const oldestEvent = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : undefined;
    const newestEvent = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined;

    return {
      totalEvents: events.length,
      eventsByLevel,
      eventsByCategory,
      oldestEvent,
      newestEvent
    };
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    actor: string,
    action: 'login' | 'logout' | 'failed_login',
    success: boolean,
    details?: Record<string, any>
  ): Promise<string> {
    return this.log({
      level: success ? 'info' : 'warn',
      category: 'authentication',
      actor,
      action,
      resource: 'authentication',
      details: { success, ...(details || {}) }
    });
  }

  /**
   * Log authorization event
   */
  async logAuthorization(
    actor: string,
    action: 'access_granted' | 'access_denied' | 'permission_changed',
    resource: string,
    success: boolean,
    details?: Record<string, any>
  ): Promise<string> {
    return this.log({
      level: success ? 'info' : 'warn',
      category: 'authorization',
      actor,
      action,
      resource,
      details: { success, ...(details || {}) }
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    actor: string,
    action: 'read' | 'write' | 'delete',
    resource: string,
    details?: Record<string, any>
  ): Promise<string> {
    return this.log({
      level: 'info',
      category: 'data_access',
      actor,
      action,
      resource,
      details
    });
  }

  /**
   * Log integrity check event
   */
  async logIntegrityCheck(
    actor: string,
    resource: string,
    success: boolean,
    details?: Record<string, any>
  ): Promise<string> {
    return this.log({
      level: success ? 'info' : 'error',
      category: 'integrity_check',
      actor,
      action: 'integrity_check',
      resource,
      details: { success, ...details }
    });
  }

  /**
   * Log blockchain event
   */
  async logBlockchainEvent(
    actor: string,
    action: string,
    txHash?: string,
    details?: Record<string, any>
  ): Promise<string> {
    return this.log({
      level: 'info',
      category: 'blockchain',
      actor,
      action,
      resource: 'blockchain',
      blockchainTx: txHash,
      details
    });
  }

  /**
   * Search audit events by text
   */
  async searchEvents(searchTerm: string, query?: AuditQuery): Promise<AuditEvent[]> {
    try {
      const events = await this.query(query || {});
      const searchLower = searchTerm.toLowerCase();

      return events.filter(event => {
        const searchableText = JSON.stringify({
          actor: event.actor,
          action: event.action,
          resource: event.resource,
          details: event.details
        }).toLowerCase();

        return searchableText.includes(searchLower);
      });
    } catch (error) {
      throw new AuditError(
        'Failed to search audit events',
        { originalError: error, searchTerm, query }
      );
    }
  }

  /**
   * Clean up old log files
   */
  private async cleanupLogFiles(retentionDays: number): Promise<void> {
    try {
      // This is a simplified implementation
      // In a real system, you'd implement proper log rotation cleanup
      const stats = await fs.stat(this.logFilePath).catch(() => null);
      if (stats) {
        const fileAge = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        if (fileAge > retentionDays) {
          // In a real implementation, you'd archive or delete old logs
          // For now, just log that cleanup would happen
          this.logger.info('Log file cleanup needed', { fileAge, retentionDays });
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}