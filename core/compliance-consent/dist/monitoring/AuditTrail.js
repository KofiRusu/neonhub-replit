"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditTrail = void 0;
const uuid_1 = require("uuid");
class AuditTrail {
    constructor() {
        this.events = [];
        this.maxEvents = 10000; // Configurable limit
    }
    logEvent(action, resource, userId, details = {}, compliance) {
        const event = {
            id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            action,
            userId,
            resource,
            details
        };
        if (compliance) {
            event.compliance = compliance;
        }
        this.events.push(event);
        // Maintain size limit
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }
        return event;
    }
    getEvents(filters, limit = 100) {
        let filtered = [...this.events];
        if (filters) {
            if (filters.userId) {
                filtered = filtered.filter(e => e.userId === filters.userId);
            }
            if (filters.action) {
                filtered = filtered.filter(e => e.action === filters.action);
            }
            if (filters.resource) {
                filtered = filtered.filter(e => e.resource.includes(filters.resource));
            }
            if (filters.startDate) {
                filtered = filtered.filter(e => e.timestamp >= filters.startDate);
            }
            if (filters.endDate) {
                filtered = filtered.filter(e => e.timestamp <= filters.endDate);
            }
            if (filters.complianceStatus) {
                filtered = filtered.filter(e => e.compliance?.status === filters.complianceStatus);
            }
        }
        return filtered
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    getComplianceViolations(regulation, limit = 50) {
        return this.events
            .filter(e => e.compliance?.status === 'violation' &&
            (!regulation || e.compliance.regulation === regulation))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    getComplianceWarnings(regulation, limit = 50) {
        return this.events
            .filter(e => e.compliance?.status === 'warning' &&
            (!regulation || e.compliance.regulation === regulation))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    getAuditMetrics() {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const sevenDays = 7 * oneDay;
        const eventsByAction = {};
        let violations = 0;
        let warnings = 0;
        let last24h = 0;
        let last7d = 0;
        for (const event of this.events) {
            // Count by action
            eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1;
            // Count compliance issues
            if (event.compliance?.status === 'violation')
                violations++;
            if (event.compliance?.status === 'warning')
                warnings++;
            // Count by time
            const age = now - event.timestamp.getTime();
            if (age <= oneDay)
                last24h++;
            if (age <= sevenDays)
                last7d++;
        }
        return {
            totalEvents: this.events.length,
            eventsByAction,
            complianceViolations: violations,
            complianceWarnings: warnings,
            eventsLast24h: last24h,
            eventsLast7d: last7d
        };
    }
    exportAuditLog(startDate, endDate, format = 'json') {
        const events = this.getEvents({ startDate, endDate }, 10000);
        if (format === 'csv') {
            const headers = ['id', 'timestamp', 'action', 'userId', 'resource', 'details', 'compliance'];
            const rows = events.map(event => [
                event.id,
                event.timestamp.toISOString(),
                event.action,
                event.userId || '',
                event.resource,
                JSON.stringify(event.details),
                event.compliance ? JSON.stringify(event.compliance) : ''
            ]);
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }
        return JSON.stringify(events, null, 2);
    }
    clearOldEvents(olderThan) {
        const initialCount = this.events.length;
        this.events = this.events.filter(event => event.timestamp >= olderThan);
        return initialCount - this.events.length;
    }
    searchEvents(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.events.filter(event => event.action.toLowerCase().includes(lowercaseQuery) ||
            event.resource.toLowerCase().includes(lowercaseQuery) ||
            (event.userId && event.userId.toLowerCase().includes(lowercaseQuery)) ||
            JSON.stringify(event.details).toLowerCase().includes(lowercaseQuery));
    }
}
exports.AuditTrail = AuditTrail;
//# sourceMappingURL=AuditTrail.js.map