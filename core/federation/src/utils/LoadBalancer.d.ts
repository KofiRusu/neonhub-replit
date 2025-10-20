import { EventEmitter } from 'events';
import { NodeInfo } from '../types';
import { Logger } from './Logger';
import { ConnectionPool } from './ConnectionPool';
export declare enum LoadBalancingStrategy {
    ROUND_ROBIN = "round_robin",
    LEAST_CONNECTIONS = "least_connections",
    RANDOM = "random",
    WEIGHTED = "weighted"
}
interface NodeStats {
    nodeId: string;
    activeConnections: number;
    successRate: number;
    averageResponseTime: number;
    weight: number;
    lastHealthCheck: number;
    healthy: boolean;
}
export declare class LoadBalancer extends EventEmitter {
    private nodes;
    private strategy;
    private logger;
    private connectionPool;
    private roundRobinIndex;
    private healthCheckInterval;
    constructor(strategy: LoadBalancingStrategy, logger: Logger, connectionPool: ConnectionPool);
    addNode(nodeInfo: NodeInfo): void;
    removeNode(nodeId: string): void;
    updateNodeStats(nodeId: string, stats: Partial<NodeStats>): void;
    selectNode(): string | null;
    private selectRoundRobin;
    private selectLeastConnections;
    private selectRandom;
    private selectWeighted;
    private calculateWeight;
    startHealthChecks(interval?: number): void;
    stopHealthChecks(): void;
    private performHealthChecks;
    getNodeStats(): NodeStats[];
    getHealthyNodes(): string[];
    getStats(): {
        totalNodes: number;
        healthyNodes: number;
        unhealthyNodes: number;
        strategy: LoadBalancingStrategy;
    };
}
export {};
//# sourceMappingURL=LoadBalancer.d.ts.map