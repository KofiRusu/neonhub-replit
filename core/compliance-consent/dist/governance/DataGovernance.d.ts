import { DataClassification, RetentionPolicy } from '../types';
export interface DataGovernanceConfig {
    classificationLevels: string[];
    retentionPolicies: Record<string, RetentionPolicy>;
    encryptionRequired: boolean;
    crossBorderControls: boolean;
}
export declare class DataGovernance {
    private classifications;
    private config;
    constructor(config: DataGovernanceConfig);
    classifyData(dataId: string, content: any, category: string, sensitivity?: number): DataClassification;
    getClassification(dataId: string): DataClassification | undefined;
    updateClassification(dataId: string, updates: Partial<DataClassification>): boolean;
    shouldRetainData(dataId: string, createdAt: Date): boolean;
    getDataForDeletion(): Array<{
        dataId: string;
        reason: string;
    }>;
    applyRetentionPolicy(dataId: string): 'retain' | 'delete' | 'review';
    checkCrossBorderCompliance(sourceRegion: string, destinationRegion: string, dataId: string): {
        allowed: boolean;
        reason?: string;
    };
    getEncryptionRequirements(dataId: string): {
        required: boolean;
        algorithm?: string;
        keyRotation?: number;
    };
    getGovernanceMetrics(): {
        totalClassifications: number;
        byLevel: Record<string, number>;
        retentionCompliance: number;
        crossBorderTransfers: number;
    };
    private getRetentionPeriod;
    private requiresEncryption;
    private allowsCrossBorder;
    private shouldApplyRetentionPolicy;
    private isAdequateRegion;
}
//# sourceMappingURL=DataGovernance.d.ts.map