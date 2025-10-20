import { ComplianceConfig, ComplianceMetrics } from './types';
export declare class ComplianceManager {
    private config;
    private regulatoryFrameworks;
    private consentManager;
    private dataGovernance;
    private retentionManager;
    private auditTrail;
    private complianceMonitor;
    private dataSubjectRights;
    private crossBorderManager;
    private federationCompliance?;
    constructor(config: ComplianceConfig);
    initialize(): Promise<void>;
    private setupRetentionPolicies;
    private startMonitoring;
    performComplianceCheck(): Promise<void>;
    grantConsent(userId: string, purposes: string[], consentTypes: string[], expiresAt?: Date): Promise<import("./types").ConsentRecord>;
    checkConsent(userId: string, purpose: string): Promise<boolean>;
    classifyData(dataId: string, content: any, category: string, sensitivity?: number): import("./types").DataClassification;
    checkCrossBorderCompliance(sourceRegion: string, destinationRegion: string, dataId: string): {
        allowed: boolean;
        reason?: string;
    };
    submitDataSubjectRequest(userId: string, type: any, justification?: string): Promise<import("./types").DataSubjectRequest>;
    handleAccessRequest(userId: string): Promise<{
        personalData: any;
        processingActivities: any[];
        recipients: string[];
    }>;
    handleErasureRequest(userId: string): Promise<{
        deleted: string[];
        retained: string[];
        reason: string;
    }>;
    initiateTransfer(sourceRegion: string, destinationRegion: string, dataClassification: any, legalBasis: string, safeguards: string[]): Promise<import("./types").CrossBorderTransfer>;
    logAuditEvent(action: string, resource: string, userId?: string, details?: any, compliance?: any): import("./types").AuditEvent;
    getComplianceMetrics(): ComplianceMetrics;
    getActiveAlerts(): {
        id: string;
        type: string;
        message: string;
        timestamp: Date;
    }[];
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
    getFederationComplianceReport(): Promise<{
        totalNodes: number;
        compliantNodes: number;
        averageComplianceScore: number;
        recentViolations: string[];
        crossBorderTransfers: number;
    }> | undefined;
    validateCompliance(data: any, regulations: string[]): {
        compliant: boolean;
        violations: string[];
        recommendations: string[];
    };
    getAuditEvents(filters?: any, limit?: number): import("./types").AuditEvent[];
    getComplianceViolations(regulation?: string, limit?: number): import("./types").AuditEvent[];
}
//# sourceMappingURL=ComplianceManager.d.ts.map