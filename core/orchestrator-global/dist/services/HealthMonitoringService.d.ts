import { EventEmitter } from 'events';
import { HealthMonitoringConfig, GlobalNodeInfo, HealthStatus, LoadMetrics, Logger } from '../types';
export declare class HealthMonitoringService extends EventEmitter {
    private config;
    private logger;
    private healthCheckTask?;
    private metricsCollectionTask?;
    private nodeHealthStatus;
    private nodeMetrics;
    private isRunning;
    constructor(config: HealthMonitoringConfig, logger: Logger);
    start(): Promise<void>;
    stop(): Promise<void>;
    private performHealthChecks;
    checkNodeHealth(node: GlobalNodeInfo): Promise<HealthStatus>;
    private collectMetrics;
    collectNodeMetrics(node: GlobalNodeInfo): Promise<LoadMetrics | null>;
    getNodeHealthStatus(nodeId: string): HealthStatus;
    getNodeMetrics(nodeId: string, limit?: number): LoadMetrics[];
    getAllNodeHealthStatuses(): Map<string, HealthStatus>;
    getHealthyNodes(): string[];
    getUnhealthyNodes(): string[];
    getHealthSummary(): any;
    calculateAverageLoad(nodeIds?: string[]): LoadMetrics | null;
}
//# sourceMappingURL=HealthMonitoringService.d.ts.map