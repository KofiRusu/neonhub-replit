import { AuditEvent } from '../types';
export declare class AuditTrail {
    private events;
    private maxEvents;
    logEvent(action: string, resource: string, userId?: string, details?: Record<string, any>, compliance?: {
        regulation: string;
        requirement: string;
        status: 'compliant' | 'violation' | 'warning';
    }): AuditEvent;
    getEvents(filters?: {
        userId?: string;
        action?: string;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
        complianceStatus?: string;
    }, limit?: number): AuditEvent[];
    getComplianceViolations(regulation?: string, limit?: number): AuditEvent[];
    getComplianceWarnings(regulation?: string, limit?: number): AuditEvent[];
    getAuditMetrics(): {
        totalEvents: number;
        eventsByAction: Record<string, number>;
        complianceViolations: number;
        complianceWarnings: number;
        eventsLast24h: number;
        eventsLast7d: number;
    };
    exportAuditLog(startDate: Date, endDate: Date, format?: 'json' | 'csv'): string;
    clearOldEvents(olderThan: Date): number;
    searchEvents(query: string): AuditEvent[];
}
//# sourceMappingURL=AuditTrail.d.ts.map