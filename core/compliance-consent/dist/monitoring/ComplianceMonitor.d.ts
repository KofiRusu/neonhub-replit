import { ComplianceMetrics } from '../types';
export interface ComplianceMonitorConfig {
    monitoringInterval: number;
    alertThresholds: {
        violations: number;
        consentExpiry: number;
    };
    reportRetention: number;
}
export declare class ComplianceMonitor {
    private config;
    private metrics;
    private alerts;
    private reports;
    constructor(config: ComplianceMonitorConfig);
    updateMetrics(updates: Partial<ComplianceMetrics>): void;
    private checkThresholds;
    private createAlert;
    getActiveAlerts(): Array<{
        id: string;
        type: string;
        message: string;
        timestamp: Date;
    }>;
    resolveAlert(alertId: string): boolean;
    generateComplianceReport(startDate: Date, endDate: Date): {
        id: string;
        period: {
            start: Date;
            end: Date;
        };
        metrics: ComplianceMetrics;
        alerts: number;
        recommendations: string[];
    };
    getComplianceMetrics(): ComplianceMetrics;
    getComplianceScore(): number;
    private generateRecommendations;
    private performMonitoring;
    getMonitoringStatus(): {
        lastCheck: Date;
        activeAlerts: number;
        complianceScore: number;
        totalReports: number;
    };
}
//# sourceMappingURL=ComplianceMonitor.d.ts.map