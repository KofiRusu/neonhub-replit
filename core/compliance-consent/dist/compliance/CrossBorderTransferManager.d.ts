import { CrossBorderTransfer } from '../types';
export declare class CrossBorderTransferManager {
    private transfers;
    initiateTransfer(sourceRegion: string, destinationRegion: string, dataClassification: any, legalBasis: string, safeguards: string[]): Promise<CrossBorderTransfer>;
    approveTransfer(transferId: string): Promise<boolean>;
    denyTransfer(transferId: string, reason: string): Promise<boolean>;
    getTransfer(transferId: string): Promise<CrossBorderTransfer | undefined>;
    getTransfersByRegion(region: string): Promise<CrossBorderTransfer[]>;
    getPendingTransfers(): Promise<CrossBorderTransfer[]>;
    private validateTransfer;
    private isAdequateRegion;
    getTransferMetrics(): Promise<{
        totalTransfers: number;
        approvedTransfers: number;
        deniedTransfers: number;
        pendingTransfers: number;
        byRegion: Record<string, number>;
    }>;
    generateTransferReport(startDate: Date, endDate: Date): Promise<{
        period: {
            start: Date;
            end: Date;
        };
        transfers: CrossBorderTransfer[];
        summary: {
            total: number;
            approved: number;
            denied: number;
            riskAssessment: string;
        };
    }>;
    private logTransfer;
    private logTransferUpdate;
}
//# sourceMappingURL=CrossBorderTransferManager.d.ts.map