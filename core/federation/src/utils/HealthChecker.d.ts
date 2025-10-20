import { EventEmitter } from 'events';
import { HealthCheckConfig, NodeInfo } from '../types';
import { Logger } from './Logger';
interface HealthStatus {
    nodeId: string;
    healthy: boolean;
    lastCheck: number;
    consecutiveFailures: number;
    responseTime: number;
    error?: string;
}
export declare class HealthChecker extends EventEmitter {
    private config;
    private logger;
    private healthStatuses;
    private checkInterval;
    private grpcClients;
    constructor(config: HealthCheckConfig, logger: Logger);
    start(): void;
    stop(): void;
    addNode(nodeInfo: NodeInfo): void;
    removeNode(nodeId: string): void;
    private performHealthChecks;
    private checkNodeHealth;
    private performHealthCheck;
    private handleUnhealthyNode;
    isNodeHealthy(nodeId: string): boolean;
    getHealthStatus(nodeId: string): HealthStatus | null;
    getAllHealthStatuses(): HealthStatus[];
    getHealthyNodes(): string[];
    getUnhealthyNodes(): string[];
    getStats(): {
        totalNodes: number;
        healthyNodes: number;
        unhealthyNodes: number;
        averageResponseTime: number;
    };
}
export {};
//# sourceMappingURL=HealthChecker.d.ts.map