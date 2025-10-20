import { DataSubjectRequest } from '../types';
export declare class DataSubjectRightsManager {
    private requests;
    submitRequest(userId: string, type: DataSubjectRequest['type'], justification?: string): Promise<DataSubjectRequest>;
    processRequest(requestId: string, action: 'approve' | 'reject' | 'complete', data?: any): Promise<boolean>;
    getRequest(requestId: string): Promise<DataSubjectRequest | undefined>;
    getUserRequests(userId: string): Promise<DataSubjectRequest[]>;
    getPendingRequests(): Promise<DataSubjectRequest[]>;
    handleAccessRequest(userId: string): Promise<{
        personalData: any;
        processingActivities: any[];
        recipients: string[];
    }>;
    handleRectificationRequest(userId: string, corrections: Record<string, any>): Promise<boolean>;
    handleErasureRequest(userId: string): Promise<{
        deleted: string[];
        retained: string[];
        reason: string;
    }>;
    handlePortabilityRequest(userId: string): Promise<{
        data: any;
        format: string;
        timestamp: Date;
    }>;
    handleRestrictionRequest(userId: string, restrictionType: 'processing' | 'storage' | 'transfer'): Promise<boolean>;
    handleObjectionRequest(userId: string, processingPurpose: string): Promise<boolean>;
    getRightsMetrics(): {
        totalRequests: number;
        pendingRequests: number;
        completedRequests: number;
        byType: Record<string, number>;
    };
    private logRequest;
    private logRequestUpdate;
}
//# sourceMappingURL=DataSubjectRightsManager.d.ts.map