export interface FederationComplianceConfig {
    federationManager: any;
    enablePrivacyPreserving: boolean;
    enableAuditSync: boolean;
    crossBorderCompliance: boolean;
}
export declare class FederationComplianceManager {
    private config;
    private nodeCompliance;
    constructor(config: FederationComplianceConfig);
    private initializeFederationHooks;
    private onNodeConnected;
    private onDataShared;
    private onModelAggregated;
    private performNodeComplianceCheck;
    private checkDataSharingCompliance;
    private checkFederatedLearningCompliance;
    private getNodeRegion;
    private isAdequateRegion;
    private checkParticipantConsent;
    getFederationComplianceReport(): Promise<{
        totalNodes: number;
        compliantNodes: number;
        averageComplianceScore: number;
        recentViolations: string[];
        crossBorderTransfers: number;
    }>;
    synchronizeComplianceAudit(): Promise<void>;
    private logFederationEvent;
}
//# sourceMappingURL=FederationComplianceManager.d.ts.map