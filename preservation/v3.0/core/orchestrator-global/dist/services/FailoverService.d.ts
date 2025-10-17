import { EventEmitter } from 'events';
import { FailoverConfig, FailoverEvent, FailoverGroup, Logger } from '../types';
export declare class FailoverService extends EventEmitter {
    private config;
    private logger;
    private failoverGroups;
    private activeFailovers;
    private nodeHealthStatus;
    constructor(config: FailoverConfig, logger: Logger);
    initializeFailoverGroups(groups: FailoverGroup[]): void;
    handleNodeFailure(nodeId: string, failureReason: string): Promise<void>;
    private initiateFailover;
    private determineFailoverType;
    private selectBackupNode;
    private executeFailover;
    manualFailover(groupId: string, targetNodeId: string, reason: string): Promise<void>;
    recoverNode(nodeId: string): Promise<void>;
    private attemptFailback;
    getFailoverGroups(): FailoverGroup[];
    getActiveFailovers(): FailoverEvent[];
    getNodeHealthStatus(nodeId: string): boolean;
    updateNodeHealth(nodeId: string, isHealthy: boolean): void;
    getFailoverStats(): any;
    createFailoverGroup(group: Omit<FailoverGroup, 'groupId'>): string;
    removeFailoverGroup(groupId: string): void;
}
//# sourceMappingURL=FailoverService.d.ts.map