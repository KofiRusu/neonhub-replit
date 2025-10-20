import { RetentionPolicy } from '../types';
export declare class DataRetentionManager {
    private retentionPolicies;
    private scheduledDeletions;
    setRetentionPolicy(dataType: string, policy: RetentionPolicy): void;
    getRetentionPolicy(dataType: string): RetentionPolicy | undefined;
    scheduleDeletion(dataId: string, dataType: string, createdAt: Date): boolean;
    getScheduledDeletions(): Array<{
        dataId: string;
        deletionDate: Date;
        dataType: string;
    }>;
    getPendingDeletions(): Array<{
        dataId: string;
        dataType: string;
        daysUntilDeletion: number;
    }>;
    executeDeletion(dataId: string): boolean;
    placeLegalHold(dataId: string): boolean;
    removeLegalHold(dataId: string): boolean;
    extendRetention(dataId: string, additionalDays: number): boolean;
    getRetentionMetrics(): {
        totalPolicies: number;
        scheduledDeletions: number;
        pendingDeletions: number;
        executedDeletions: number;
    };
    validateRetentionCompliance(dataType: string, createdAt: Date): {
        compliant: boolean;
        reason?: string;
        recommendedAction?: string;
    };
    private logDeletion;
}
//# sourceMappingURL=DataRetentionManager.d.ts.map